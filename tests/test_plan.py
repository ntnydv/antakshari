"""Behavioral checks for dependency dispatch safety and ownership validation."""

from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from validate_plan import (dependency_errors, first_day_errors, markdown_errors,
                           model_policy_errors, ownership_errors, paths_overlap)


def task(task_id, dependencies=(), paths=None):
    return {'id': task_id, 'component': 'C01', 'dependencies': list(dependencies),
            'owned_paths': paths or [f'src/{task_id}.ts']}


class DependencySafetyTests(unittest.TestCase):
    def test_diamond_has_no_cycle(self):
        tasks = [task('root'), task('left', ['root']), task('right', ['root']),
                 task('join', ['left', 'right'])]
        self.assertEqual([], dependency_errors(tasks))

    def test_cycle_is_rejected_even_with_an_independent_ready_task(self):
        errors = dependency_errors([task('ready'), task('a', ['b']), task('b', ['a'])])
        self.assertTrue(any('cycle' in error.lower() for error in errors))

    def test_dangling_dependency_is_not_treated_as_ready(self):
        errors = dependency_errors([task('a', ['not-created'])])
        self.assertTrue(any('missing dependency not-created' in error for error in errors))


class OwnershipSafetyTests(unittest.TestCase):
    def test_same_file_is_a_conflict_across_tasks(self):
        errors = ownership_errors([task('a', paths=['src/shared.ts']), task('b', paths=['src/shared.ts'])])
        self.assertTrue(any('overlap' in error for error in errors))

    def test_directory_and_wildcard_scopes_include_descendants(self):
        self.assertTrue(paths_overlap('src/feature/**', 'src/feature/deep/model.ts'))
        self.assertTrue(paths_overlap('src/feature/', 'src/feature/model.ts'))
        self.assertFalse(paths_overlap('src/feature-one.ts', 'src/feature-two.ts'))

    def test_bootstrap_is_excluded_but_unsafe_paths_are_rejected(self):
        bootstrap = task('BOOT', paths=['src/**'])
        bootstrap.update(component='BOOT', kind='bootstrap')
        self.assertEqual([], ownership_errors([bootstrap, task('a')]))
        self.assertTrue(ownership_errors([task('a', paths=['../outside.ts'])]))


class FirstDaySafetyTests(unittest.TestCase):
    def test_selection_requires_the_full_prerequisite_chain(self):
        tasks = [task('a'), task('b', ['a']), task('c', ['b'])]
        self.assertTrue(first_day_errors(tasks, ['b', 'c']))
        self.assertEqual([], first_day_errors(tasks, ['a', 'b', 'c'], 3))

    def test_selection_rejects_unknown_and_repeated_ids(self):
        errors = first_day_errors([task('a')], ['a', 'a', 'unknown'])
        self.assertTrue(any('duplicate' in error for error in errors))
        self.assertTrue(any('does not exist' in error for error in errors))


class DocumentationSafetyTests(unittest.TestCase):
    def test_missing_local_target_and_anchor_are_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'README.md'
            (root / 'target.md').write_text('# Existing heading\n', encoding='utf-8')
            text = '[ok](target.md#existing-heading) [bad](target.md#missing) [gone](absent.md)\n'
            errors = markdown_errors(root, source, text)
            self.assertEqual(2, len(errors))

    def test_code_examples_are_not_rendered_markdown_links(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.assertEqual([], markdown_errors(root, root / 'README.md', '```md\n[x](future.md)\n```\n'))

    def test_contributor_and_unverified_models_are_rejected(self):
        self.assertTrue(model_policy_errors({'route': {'model': 'muse-spark-1.3-contributor'}}))
        self.assertTrue(model_policy_errors({'model': 'muse-voice-generate-1.0'}))
        self.assertEqual([], model_policy_errors({'model': 'muse-voice-transcribe-1.0'}))


if __name__ == '__main__':
    unittest.main()
