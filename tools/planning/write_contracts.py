#!/usr/bin/env python3
"""Generate the initial proposed wire schemas and policy fixtures; no services."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2]
def save(p,o):
 p=ROOT/p;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(o,indent=2,ensure_ascii=False)+'\n')
def obj(properties,required=None):return {'type':'object','properties':properties,'required':list(properties) if required is None else required,'additionalProperties':False}
S={'type':'string','minLength':1,'maxLength':128}
ID={'type':'string','pattern':'^[A-Za-z0-9_-]{1,128}$'}
N={'type':'integer','minimum':0}
TS={'type':'integer','minimum':0}
NULL_ID={'anyOf':[ID,{'type':'null'}]}
def enum(*a):return {'type':'string','enum':list(a)}
def arr(item,maxi=64):return {'type':'array','items':item,'maxItems':maxi}
def schema(name,body):return {'$schema':'https://json-schema.org/draft/2020-12/schema','$id':f'urn:antakshari:{name}:v1',**body}
commands={
 'room.create':obj({'mode':enum('1v1','2v2'),'packId':ID,'preset':enum('standard6','marathon10'),'partyReview':{'type':'boolean'}}),
 'room.join':obj({'inviteCode':{'type':'string','pattern':'^[A-Z2-9]{6}$'}}),
 'room.leave':obj({}),
 'room.settings.update':obj({'packId':ID,'preset':enum('standard6','marathon10'),'partyReview':{'type':'boolean'}}),
 'room.team.select':obj({'teamId':enum('A','B')}),
 'room.ready':obj({'ready':{'type':'boolean'},'settingsVersion':N,'micReady':{'type':'boolean'},'mediaReady':{'type':'boolean'}}),
 'match.start':obj({}),
 'cue.ready':obj({'promptId':ID,'phaseToken':ID,'assetHashes':arr({'type':'string','pattern':'^[a-f0-9]{64}$'},8)}),
 'answer.request':obj({'promptId':ID,'phaseToken':ID}),
 'answer.buzz':obj({'promptId':ID,'phaseToken':ID}),
 'answer.submit':obj({'attemptId':ID,'grantGeneration':N,'audioObjectId':NULL_ID,'audioSha256':{'anyOf':[{'type':'string','pattern':'^[a-f0-9]{64}$'},{'type':'null'}]},'titleAnswers':arr({'type':'string','maxLength':160},2)}),
 'hint.request':obj({'promptId':ID,'phaseToken':ID}),
 'review.request':obj({'attemptId':ID,'reason':enum('wrong_song','wrong_section','capture_failure','valid_variant','other_rule')}),
 'review.vote':obj({'reviewId':ID,'resolution':enum('accept','reject','void')}),
 'match.resume':obj({'lastSeq':N}),
 'match.rematch':obj({'ready':{'type':'boolean'}})
}
variants=[]
for typ,payload in commands.items():
 variants.append(obj({'schemaVersion':{'const':1},'commandId':{'type':'string','format':'uuid'},'roomId':NULL_ID,'matchId':NULL_ID,
  'expectedVersion':{'anyOf':[N,{'type':'null'}]},'type':{'const':typ},'payload':payload}))
save('packages/contracts/schema/command.schema.json',schema('command',{'oneOf':variants}))
phases=['lobby','preparing','countdown','round_intro','cue','answer_open','recording','adjudicating','reveal','round_summary','finished','paused','abandoned']
save('packages/contracts/schema/snapshot.schema.json',schema('snapshot',obj({
 'schemaVersion':{'const':1},'roomId':ID,'matchId':ID,'version':N,'seq':N,'phase':enum(*phases),'phaseToken':ID,
 'roundId':enum(*[f'R{i:02d}' for i in range(1,11)]),'roundInstanceId':ID,'promptId':NULL_ID,'activeUid':NULL_ID,
 'deadlineMs':{'anyOf':[TS,{'type':'null'}]},'serverNowMs':TS,'scores':obj({'A':{'type':'integer'},'B':{'type':'integer'}}),
 'catalogueVersion':ID,'rulesVersion':ID,'resultStatus':enum('in_progress','verified','provisional','abandoned')
})))
save('packages/contracts/schema/model-evidence.schema.json',schema('model-evidence',obj({
 'schemaVersion':{'const':1},'candidateId':NULL_ID,'sectionId':NULL_ID,'relation':enum('MATCH','MISMATCH','INSUFFICIENT'),
 'matchedSpanIds':arr(ID,20),'contradictionCodes':arr(S,10),'insufficientEvidence':{'type':'boolean'}
})))
save('packages/contracts/schema/adjudication.schema.json',schema('adjudication',obj({
 'schemaVersion':{'const':1},'attemptId':ID,'grantGeneration':N,
 'verdict':enum('accepted','rejected','uncertain','invalid_attempt','cancelled'),
 'reasonCodes':arr(enum('VALID','WRONG_SONG','WRONG_SECTION','WRONG_START_SOUND','KEYWORD_MISSING','REPEAT_SONG','NO_FINAL_TRANSCRIPT','INSUFFICIENT_EVIDENCE','PROVIDER_FAILURE','STALE_ATTEMPT','CANCELLED','CAPTURE_FAILURE','UNSUPPORTED_CATALOGUE'),12),
 'songIds':arr(ID,2),'sectionIds':arr(ID,2),'evidenceId':ID,'policyVersion':ID,
 'provenance':enum('AUTO_EVALUATED','PARTICIPANT_REVIEW','DETERMINISTIC_FIXTURE'),'settledAtMs':TS
})))
save('packages/contracts/schema/error.schema.json',schema('error',obj({
 'schemaVersion':{'const':1},'code':enum('UNAUTHENTICATED','PERMISSION_DENIED','INVALID_ARGUMENT','VERSION_CONFLICT','NOT_READY','ROOM_FULL','INVITE_INVALID','RATE_LIMITED','TEMPORARILY_UNAVAILABLE','BUDGET_EXHAUSTED','STALE_ATTEMPT','UPGRADE_REQUIRED'),
 'messageKey':S,'retryable':{'type':'boolean'},'retryAfterMs':{'anyOf':[N,{'type':'null'}]},'currentVersion':{'anyOf':[N,{'type':'null'}]},'requestId':ID
})))
save('packages/contracts/schema/task-result.schema.json',schema('task-result',obj({
 'schema_version':{'const':1},'task_id':{'type':'string','pattern':'^(BOOT-[0-9]{3}|[CR][0-9]{2}-[0-9]{2}-[IUAX])$'},
 'worker':S,'batch_id':ID,'status':enum('implemented','blocked','failed'),
 'base_sha':{'type':'string','pattern':'^[a-f0-9]{40}$'},'implementation_sha':{'anyOf':[{'type':'string','pattern':'^[a-f0-9]{40}$'},{'type':'null'}]},
 'summary':{'type':'string','minLength':10,'maxLength':5000},'changed_files':arr(S,200),
 'checks':arr(obj({'command':S,'exit_code':{'type':'integer'},'log_path':S,'environment':S}),30),
 'blockers':arr(S,20),'remaining_risks':arr(S,20),'provider_mode':enum('not_used','fake','live'),
 'evidence_paths':arr(S,30)
})))
save('config/model-policy.json',{
 'schemaVersion':1,'verifiedOn':'2026-10-27','baseUrl':'https://api.meta.ai/v1','dataMode':'standard',
 'routes':{
  'transcription':{'model':'muse-voice-transcribe-1.0','enabled':False,'gate':'account_smoke_and_singing_evaluation'},
  'textEvidence':{'model':'muse-spark-1.3','enabled':False,'gate':'account_smoke_and_schema_evaluation'},
  'hostText':{'model':'muse-spark-1.3','enabled':False,'fallback':'curated_template'},
  'audioFallback':{'model':'muse-spark-1.2','enabled':False,'gate':'audio_singing_benchmark'},
  'offlineVisualReview':{'model':'muse-spark-1.3','enabled':False,'gate':'editor_opt_in'},
  'offlineComplexAudit':{'model':'muse-wonder-1.0','enabled':False,'gate':'editor_opt_in_budget'},
  'offlineImageClue':{'model':'muse-image-1.0','enabled':False,'gate':'editor_opt_in_and_rights'}},
 'unsupportedAssumptions':['native_asr_confidence','word_timestamps','muse_text_to_speech','guaranteed_singing_accuracy','video_generation_api'],
 'timeoutsMs':{'connection':3000,'verdictTarget':4000,'verdictHardLimit':8000},'maximumCaptureMs':20000,
 'liveCallsRequireServerSecret':True,'rawTranscriptLogging':False})
save('config/game-rules.json',{
 'schemaVersion':1,'rulesVersion':'pilot-v1','maxPlayers':4,'standardRounds':6,'marathonRounds':10,
 'marathonRequiresMode':'2v2','disabledIn1v1':['R07'],'primaryOpportunitiesPerTeam':2,'roundCap':40,'roundFloor':-10,
 'hintReduction':5,'wrongBuzzPenalty':5,'defaultStealPoints':10,'reconnectGraceMs':30000,'maxGracePerInterruptedTurn':1,
 'partyBuzzerContenderMs':100,'defaultAnswerAllocation':'assigned_equal_turns','maxCaptureMs':20000,
 'rounds':{
 'R01':{'startMs':20000,'captureMs':15000,'maxPoints':20,'steal':False},
 'R02':{'cueMs':5000,'identifyMs':8000,'captureMs':15000,'identifyPoints':10,'singPoints':10,'steal':True},
 'R03':{'startMs':15000,'captureMs':20000,'maxPoints':20,'steal':True},
 'R04':{'startMs':20000,'captureMs':20000,'maxPoints':20,'steal':True},
 'R05':{'startMs':10000,'captureMs':15000,'maxPoints':20,'steal':True},
 'R06':{'startMs':15000,'captureMs':20000,'maxPoints':20,'steal':False},
 'R07':{'readyMs':10000,'humMs':20000,'guessMs':10000,'maxPoints':20,'singPoints':0,'steal':True},
 'R08':{'cuePartMs':4000,'gapMs':500,'answerMs':15000,'pointsPerSong':10,'singPoints':0,'stealPerSong':5},
 'R09':{'cueMs':6000,'startMs':12000,'captureMs':20000,'identifyPoints':10,'singPoints':10,'steal':True},
 'R10':{'startMs':15000,'captureMs':20000,'identifyPoints':10,'singPoints':10,'steal':True}}})
save('config/provider-rates.json',{'asOf':'2026-10-27','currency':'USD','source':'https://dev.meta.ai/docs/pricing-rate-limits',
 'spark':{'inputPerMillion':1.25,'outputPerMillion':4.25,'cachedInputPerMillion':0.15},
 'wonder':{'inputPerMillion':4,'outputPerMillion':20,'cachedInputPerMillion':0.20},
 'asrPerHour':0.18,'imagePerImage':0.01,'note':'Reference rates, not a quote or total app cost. Recheck before live rollout.'})
print('Wrote six schemas and three policy fixtures.')
