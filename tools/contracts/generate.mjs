import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const packageRoot = path.join(root, 'packages/contracts');
export const schemas = Object.fromEntries(fs.readdirSync(path.join(packageRoot, 'schema')).filter(f => f.endsWith('.schema.json')).sort().map(f => [f.replace('.schema.json', ''), JSON.parse(fs.readFileSync(path.join(packageRoot, 'schema', f), 'utf8'))]));
const pascal = value => value.split(/[^A-Za-z0-9]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const names = Object.fromEntries(Object.entries(schemas).map(([k, v]) => [v.$id, pascal(k)]));
const supported = new Set(['$schema','$id','$ref','title','description','type','properties','required','additionalProperties','patternProperties','maxProperties','oneOf','anyOf','allOf','if','then','not','const','enum','items','minItems','maxItems','minimum','maximum','minLength','maxLength','pattern','format']);
function checkKeywords(s) {
  if (typeof s === 'boolean') return;
  for (const [key,value] of Object.entries(s)) {
    if (!supported.has(key)) throw new Error(`Generator does not support schema keyword ${key}`);
    if (['properties','patternProperties'].includes(key)) Object.values(value).forEach(checkKeywords);
    if (['oneOf','anyOf','allOf'].includes(key)) value.forEach(checkKeywords);
    if (['items','if','then','not'].includes(key) || key === 'additionalProperties' && typeof value === 'object') checkKeywords(value);
    if (key === 'format' && !['uuid','uri'].includes(value)) throw new Error(`Unsupported format ${value}`);
  }
}
Object.values(schemas).forEach(checkKeywords);
const literal = v => JSON.stringify(v);
function ts(s) {
  if (s.$ref) return names[s.$ref];
  if ('const' in s) return literal(s.const);
  if (s.enum) return s.enum.map(literal).join(' | ');
  if (s.oneOf || s.anyOf) return (s.oneOf || s.anyOf).map(x => `(${ts(x)})`).join(' | ');
  if (s.type === 'null') return 'null';
  if (s.type === 'string') return 'string';
  if (['integer','number'].includes(s.type)) return 'number';
  if (s.type === 'boolean') return 'boolean';
  if (s.type === 'array') return `ReadonlyArray<${ts(s.items)}>`;
  if (s.type === 'object') {
    if (s.patternProperties) return `Readonly<Record<string, ${Object.values(s.patternProperties).map(ts).join(' | ')}>>`;
    return `{ ${Object.entries(s.properties || {}).map(([k,v]) => `readonly ${literal(k)}${s.required?.includes(k) ? '' : '?'}: ${ts(v)};`).join(' ')} }`;
  }
  throw new Error(`No type for ${JSON.stringify(s)}`);
}

function dartBindings() {
  const classes = new Map();
  function dtype(s, name) {
    if (s.$ref) return names[s.$ref];
    if (s.anyOf) {
      const nonnull = s.anyOf.filter(x => x.type !== 'null');
      if (nonnull.length === 1 && nonnull.length !== s.anyOf.length) return dtype(nonnull[0], name) + '?';
      return 'Object?'; // bounded metadata scalar union is validated before exposure
    }
    if ('const' in s) return typeof s.const === 'string' ? 'String' : typeof s.const === 'boolean' ? 'bool' : 'int';
    if (s.enum) return s.type === 'integer' ? 'int' : 'String';
    if (s.type === 'string') return 'String';
    if (s.type === 'integer') return 'int';
    if (s.type === 'boolean') return 'bool';
    if (s.type === 'array') return `List<${dtype(s.items, name + 'Item')}>`;
    if (s.type === 'object') {
      if (s.patternProperties) return 'Map<String, Object?>';
      addObject(name, s);
      return name;
    }
    if (s.type === 'null') return 'Null';
    throw new Error(`No Dart type ${name}`);
  }
  function convert(s, expr, name) {
    if (s.anyOf) {
      const nonnull = s.anyOf.filter(x => x.type !== 'null');
      if (nonnull.length === 1 && nonnull.length !== s.anyOf.length) return `${expr} == null ? null : ${convert(nonnull[0],expr,name)}`;
      return expr;
    }
    if (s.$ref) return `${names[s.$ref]}.fromJson(${expr})`;
    if (s.type === 'array') return `List.unmodifiable((${expr} as List).map((v) => ${convert(s.items,'v',name+'Item')}))`;
    if (s.type === 'object') return s.patternProperties ? `${expr} as Map<String, Object?>` : `${name}.fromJson(${expr})`;
    return dtype(s,name) === 'int' ? `(${expr} as num).toInt()` : `${expr} as ${dtype(s,name)}`;
  }
  function encode(s, expr) {
    if (s.anyOf) {
      const nonnull=s.anyOf.filter(x => x.type !== 'null');
      if (nonnull.length === 1 && nonnull.length !== s.anyOf.length) return `${expr} == null ? null : ${encode(nonnull[0],expr+'!')}`;
      return expr;
    }
    if (s.$ref || s.type === 'object' && !s.patternProperties) return `${expr}.toJson()`;
    if (s.type === 'object') return `cloneJson(${expr})`;
    if (s.type === 'array') return `${expr}.map((v) => ${encode(s.items,'v')}).toList()`;
    return expr;
  }
  function addObject(name, s, parent = null) {
    if (classes.has(name)) return;
    classes.set(name, '');
    const fields = Object.entries(s.properties || {}).map(([key,value]) => {
      const base = dtype(value,name+pascal(key));
      const optional = !s.required.includes(key);
      const type = optional && !base.endsWith('?') ? base+'?' : base;
      const expr = `_json[${literal(key)}]`;
      const getter = convert(value,expr,name+pascal(key));
      return `  ${type} get ${key === "final" ? "isFinal" : key} => ${optional ? `${expr} == null ? null : ` : ''}${getter};`;
    }).join('\n');
    const encoded=Object.entries(s.properties || {}).map(([key,value]) => {
      const getter=key === 'final' ? 'isFinal' : key;
      const optional=!s.required.includes(key);
      let body=encode(value,optional ? `${getter}!` : getter);
      if (optional) body=`${getter} == null ? null : ${body}`;
      return `    ${optional ? `if (_json.containsKey(${literal(key)})) ` : ''}${literal(key)}: ${body},`;
    }).join('\n');
    classes.set(name, `final class ${name}${parent ? ` extends ${parent}` : ''} {\n  final Map<String, Object?> _json;\n  ${name}._(this._json);\n  factory ${name}.fromJson(Object? value) {\n    assertJson(value);\n    ${parent ? `validateNamed(${literal(Object.keys(schemas).find(k => pascal(k) === parent))}, value);\n    validateAgainst(${dartLiteral(s)}, value);` : s.$id ? `validateNamed(${literal(Object.keys(schemas).find(k => schemas[k].$id === s.$id))}, value);` : `validateAgainst(${dartLiteral(s)}, value);`}\n    return ${name}._(freezeJson(value) as Map<String, Object?>);\n  }\n${fields}\n  ${parent ? '@override\n  ' : ''}Map<String, Object?> toJson() => {\n${encoded || '    ..._json,'}\n  };\n}\n`);
  }
  const unions = [];
  for (const [key,s] of Object.entries(schemas)) {
    const name = pascal(key);
    if (s.oneOf) {
      const discr = key === 'round-config' ? 'roundId' : 'type';
      const cases = s.oneOf.map(variant => {
        const tag = variant.properties[discr].const;
        const child = name + pascal(tag);
        addObject(child,variant,name);
        return `      case ${literal(tag)}: return ${child}.fromJson(value);`;
      }).join('\n');
      unions.push(`sealed class ${name} {\n  ${name}();\n  factory ${name}.fromJson(Object? value) {\n    validateNamed(${literal(key)}, value);\n    switch ((value as Map)[${literal(discr)}]) {\n${cases}\n      default: throw const FormatException('Unknown ${name} discriminator');\n    }\n  }\n  Map<String, Object?> toJson();\n}\n`);
    } else addObject(name,s);
  }
  return `// GENERATED by tools/contracts/generate.mjs; do not edit.\nimport 'runtime.dart';\n\n${unions.join('\n')}\n${[...classes.values()].join('\n')}`;
}
function dartLiteral(value) { return JSON.stringify(value).replace(/\$/g,'\\$'); }
export function outputs() {
  const typings = Object.entries(schemas).map(([name,s]) => `export type ${pascal(name)} = ${ts(s)};`).join('\n\n');
  const map = Object.keys(schemas).map(name => `readonly ${literal(name)}: ${pascal(name)};`).join('\n  ');
  return {
    'src/generated.ts': `// GENERATED by tools/contracts/generate.mjs; do not edit.\n${typings}\n\nexport interface ContractByName {\n  ${map}\n}\nexport type ContractName = keyof ContractByName;\n`,
    'src/schemas.generated.ts': `// GENERATED; do not edit.\nexport const schemas: Record<string, Record<string, unknown>> = ${JSON.stringify(schemas,null,2)};\n`,
    'dart/lib/src/bindings.g.dart': dartBindings(),
    'dart/lib/src/schemas.g.dart': `// GENERATED; do not edit.\nconst Map<String, Object?> schemas = ${dartLiteral(schemas)};\n`,
  };
}
export function generate(check=false) {
  const out=outputs();
  const hashes = {};
  for (const [name,s] of Object.entries(schemas)) hashes[`schema/${name}.schema.json`] = crypto.createHash('sha256').update(fs.readFileSync(path.join(packageRoot,'schema',name+'.schema.json'))).digest('hex');
  for (const [file,content] of Object.entries(out)) hashes[file] = crypto.createHash('sha256').update(content).digest('hex');
  out['manifest.json'] = JSON.stringify({schemaVersion:1,generatorVersion:1,sha256:hashes},null,2)+'\n';
  for (const [file,content] of Object.entries(out)) {
    const target=path.join(packageRoot,file);
    if (check) { if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== content) throw new Error(`Stale generated artifact: ${file}; run npm run generate in packages/contracts`); }
    else { fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,content); }
  }
  return Object.keys(out).length;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(`Generated/verified ${generate(process.argv.includes('--check'))} artifacts.`);
