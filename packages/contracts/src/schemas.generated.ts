// GENERATED; do not edit.
export const schemas: Record<string, Record<string, unknown>> = {
  "adjudication": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:adjudication:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "attemptId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "grantGeneration": {
        "type": "integer",
        "minimum": 0
      },
      "verdict": {
        "type": "string",
        "enum": [
          "accepted",
          "rejected",
          "uncertain",
          "invalid_attempt",
          "cancelled"
        ]
      },
      "reasonCodes": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "VALID",
            "WRONG_SONG",
            "WRONG_SECTION",
            "WRONG_START_SOUND",
            "KEYWORD_MISSING",
            "REPEAT_SONG",
            "NO_FINAL_TRANSCRIPT",
            "INSUFFICIENT_EVIDENCE",
            "PROVIDER_FAILURE",
            "STALE_ATTEMPT",
            "CANCELLED",
            "CAPTURE_FAILURE",
            "UNSUPPORTED_CATALOGUE"
          ]
        },
        "maxItems": 12
      },
      "songIds": {
        "type": "array",
        "items": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_-]{1,128}$"
        },
        "maxItems": 2
      },
      "sectionIds": {
        "type": "array",
        "items": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_-]{1,128}$"
        },
        "maxItems": 2
      },
      "evidenceId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "policyVersion": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "provenance": {
        "type": "string",
        "enum": [
          "AUTO_EVALUATED",
          "PARTICIPANT_REVIEW",
          "DETERMINISTIC_FIXTURE"
        ]
      },
      "settledAtMs": {
        "type": "integer",
        "minimum": 0
      }
    },
    "required": [
      "schemaVersion",
      "attemptId",
      "grantGeneration",
      "verdict",
      "reasonCodes",
      "songIds",
      "sectionIds",
      "evidenceId",
      "policyVersion",
      "provenance",
      "settledAtMs"
    ],
    "additionalProperties": false
  },
  "attempt": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:attempt:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "attemptId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "generation": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      },
      "actor": {
        "type": "object",
        "properties": {
          "uid": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "teamId": {
            "type": "string",
            "enum": [
              "A",
              "B"
            ]
          }
        },
        "required": [
          "uid",
          "teamId"
        ],
        "additionalProperties": false
      },
      "mediaDigest": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[a-f0-9]{64}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "phase": {
        "type": "string",
        "enum": [
          "granted",
          "capturing",
          "sealed",
          "adjudicating",
          "review_pending",
          "settled",
          "cancelled"
        ]
      },
      "sealedAtMs": {
        "anyOf": [
          {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          {
            "type": "null"
          }
        ]
      },
      "decisionRef": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      }
    },
    "required": [
      "schemaVersion",
      "attemptId",
      "generation",
      "actor",
      "mediaDigest",
      "phase",
      "sealedAtMs",
      "decisionRef"
    ],
    "additionalProperties": false
  },
  "command-receipt": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:command-receipt:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "commandId": {
        "type": "string",
        "format": "uuid"
      },
      "requestDigest": {
        "type": "string",
        "pattern": "^[a-f0-9]{64}$"
      },
      "status": {
        "type": "string",
        "enum": [
          "applied",
          "rejected"
        ]
      },
      "roomId": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "matchId": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "version": {
        "anyOf": [
          {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          {
            "type": "null"
          }
        ]
      },
      "seq": {
        "anyOf": [
          {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          {
            "type": "null"
          }
        ]
      },
      "snapshotRef": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "grantRef": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "error": {
        "anyOf": [
          {
            "$ref": "urn:antakshari:error:v1"
          },
          {
            "type": "null"
          }
        ]
      },
      "createdAtMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      },
      "expiresAtMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      }
    },
    "required": [
      "schemaVersion",
      "commandId",
      "requestDigest",
      "status",
      "roomId",
      "matchId",
      "version",
      "seq",
      "snapshotRef",
      "grantRef",
      "error",
      "createdAtMs",
      "expiresAtMs"
    ],
    "additionalProperties": false
  },
  "command": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:command:v1",
    "oneOf": [
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "room.create"
          },
          "payload": {
            "type": "object",
            "properties": {
              "mode": {
                "type": "string",
                "enum": [
                  "1v1",
                  "2v2"
                ]
              },
              "packId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "preset": {
                "type": "string",
                "enum": [
                  "standard6",
                  "marathon10"
                ]
              },
              "partyReview": {
                "type": "boolean"
              }
            },
            "required": [
              "mode",
              "packId",
              "preset",
              "partyReview"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "room.join"
          },
          "payload": {
            "type": "object",
            "properties": {
              "inviteCode": {
                "type": "string",
                "pattern": "^[A-Z2-9]{6}$"
              }
            },
            "required": [
              "inviteCode"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "room.leave"
          },
          "payload": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "room.settings.update"
          },
          "payload": {
            "type": "object",
            "properties": {
              "packId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "preset": {
                "type": "string",
                "enum": [
                  "standard6",
                  "marathon10"
                ]
              },
              "partyReview": {
                "type": "boolean"
              }
            },
            "required": [
              "packId",
              "preset",
              "partyReview"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "room.team.select"
          },
          "payload": {
            "type": "object",
            "properties": {
              "teamId": {
                "type": "string",
                "enum": [
                  "A",
                  "B"
                ]
              }
            },
            "required": [
              "teamId"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "room.ready"
          },
          "payload": {
            "type": "object",
            "properties": {
              "ready": {
                "type": "boolean"
              },
              "settingsVersion": {
                "type": "integer",
                "minimum": 0
              },
              "micReady": {
                "type": "boolean"
              },
              "mediaReady": {
                "type": "boolean"
              }
            },
            "required": [
              "ready",
              "settingsVersion",
              "micReady",
              "mediaReady"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "match.start"
          },
          "payload": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "cue.ready"
          },
          "payload": {
            "type": "object",
            "properties": {
              "promptId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "phaseToken": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "assetHashes": {
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-f0-9]{64}$"
                },
                "maxItems": 8
              }
            },
            "required": [
              "promptId",
              "phaseToken",
              "assetHashes"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "answer.request"
          },
          "payload": {
            "type": "object",
            "properties": {
              "promptId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "phaseToken": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              }
            },
            "required": [
              "promptId",
              "phaseToken"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "answer.buzz"
          },
          "payload": {
            "type": "object",
            "properties": {
              "promptId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "phaseToken": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              }
            },
            "required": [
              "promptId",
              "phaseToken"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "answer.submit"
          },
          "payload": {
            "type": "object",
            "properties": {
              "attemptId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "grantGeneration": {
                "type": "integer",
                "minimum": 0
              },
              "audioObjectId": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^[A-Za-z0-9_-]{1,128}$"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "audioSha256": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^[a-f0-9]{64}$"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "titleAnswers": {
                "type": "array",
                "items": {
                  "type": "string",
                  "maxLength": 160
                },
                "maxItems": 2
              }
            },
            "required": [
              "attemptId",
              "grantGeneration",
              "audioObjectId",
              "audioSha256",
              "titleAnswers"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "hint.request"
          },
          "payload": {
            "type": "object",
            "properties": {
              "promptId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "phaseToken": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              }
            },
            "required": [
              "promptId",
              "phaseToken"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "review.request"
          },
          "payload": {
            "type": "object",
            "properties": {
              "attemptId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "reason": {
                "type": "string",
                "enum": [
                  "wrong_song",
                  "wrong_section",
                  "capture_failure",
                  "valid_variant",
                  "other_rule"
                ]
              }
            },
            "required": [
              "attemptId",
              "reason"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "review.vote"
          },
          "payload": {
            "type": "object",
            "properties": {
              "reviewId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "resolution": {
                "type": "string",
                "enum": [
                  "accept",
                  "reject",
                  "void"
                ]
              }
            },
            "required": [
              "reviewId",
              "resolution"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "match.resume"
          },
          "payload": {
            "type": "object",
            "properties": {
              "lastSeq": {
                "type": "integer",
                "minimum": 0
              }
            },
            "required": [
              "lastSeq"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "commandId": {
            "type": "string",
            "format": "uuid"
          },
          "roomId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "matchId": {
            "anyOf": [
              {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              {
                "type": "null"
              }
            ]
          },
          "expectedVersion": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 0
              },
              {
                "type": "null"
              }
            ]
          },
          "type": {
            "const": "match.rematch"
          },
          "payload": {
            "type": "object",
            "properties": {
              "ready": {
                "type": "boolean"
              }
            },
            "required": [
              "ready"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "commandId",
          "roomId",
          "matchId",
          "expectedVersion",
          "type",
          "payload"
        ],
        "additionalProperties": false
      }
    ]
  },
  "domain-event": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:domain-event:v1",
    "oneOf": [
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "eventId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "matchId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "seq": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "version": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "occurredAtMs": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "type": {
            "const": "snapshot.updated"
          },
          "payload": {
            "$ref": "urn:antakshari:snapshot:v1"
          },
          "metadata": {
            "type": "object",
            "maxProperties": 5,
            "properties": {
              "delivery_attempt": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "replay": {
                "type": "boolean"
              },
              "trace_sampled": {
                "type": "boolean"
              },
              "x_metric_resync": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "x_metric_delivery_latency_ms": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000000
              }
            },
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "eventId",
          "matchId",
          "seq",
          "version",
          "occurredAtMs",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "eventId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "matchId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "seq": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "version": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "occurredAtMs": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "type": {
            "const": "cue.started"
          },
          "payload": {
            "$ref": "urn:antakshari:safe-cue:v1"
          },
          "metadata": {
            "type": "object",
            "maxProperties": 5,
            "properties": {
              "delivery_attempt": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "replay": {
                "type": "boolean"
              },
              "trace_sampled": {
                "type": "boolean"
              },
              "x_metric_resync": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "x_metric_delivery_latency_ms": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000000
              }
            },
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "eventId",
          "matchId",
          "seq",
          "version",
          "occurredAtMs",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "eventId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "matchId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "seq": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "version": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "occurredAtMs": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "type": {
            "const": "answer.opened"
          },
          "payload": {
            "type": "object",
            "properties": {
              "promptId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "phaseToken": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "activeUid": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^[A-Za-z0-9_-]{1,128}$"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "deadlineMs": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9007199254740991
              }
            },
            "required": [
              "promptId",
              "phaseToken",
              "activeUid",
              "deadlineMs"
            ],
            "additionalProperties": false
          },
          "metadata": {
            "type": "object",
            "maxProperties": 5,
            "properties": {
              "delivery_attempt": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "replay": {
                "type": "boolean"
              },
              "trace_sampled": {
                "type": "boolean"
              },
              "x_metric_resync": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "x_metric_delivery_latency_ms": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000000
              }
            },
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "eventId",
          "matchId",
          "seq",
          "version",
          "occurredAtMs",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "eventId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "matchId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "seq": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "version": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "occurredAtMs": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "type": {
            "const": "attempt.changed"
          },
          "payload": {
            "type": "object",
            "properties": {
              "attemptId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              },
              "generation": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9007199254740991
              },
              "status": {
                "type": "string",
                "enum": [
                  "granted",
                  "capturing",
                  "sealed",
                  "adjudicating",
                  "review_pending",
                  "settled",
                  "cancelled"
                ]
              }
            },
            "required": [
              "attemptId",
              "generation",
              "status"
            ],
            "additionalProperties": false
          },
          "metadata": {
            "type": "object",
            "maxProperties": 5,
            "properties": {
              "delivery_attempt": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "replay": {
                "type": "boolean"
              },
              "trace_sampled": {
                "type": "boolean"
              },
              "x_metric_resync": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "x_metric_delivery_latency_ms": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000000
              }
            },
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "eventId",
          "matchId",
          "seq",
          "version",
          "occurredAtMs",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "eventId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "matchId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "seq": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "version": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "occurredAtMs": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "type": {
            "const": "round.revealed"
          },
          "payload": {
            "$ref": "urn:antakshari:safe-reveal:v1"
          },
          "metadata": {
            "type": "object",
            "maxProperties": 5,
            "properties": {
              "delivery_attempt": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "replay": {
                "type": "boolean"
              },
              "trace_sampled": {
                "type": "boolean"
              },
              "x_metric_resync": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "x_metric_delivery_latency_ms": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000000
              }
            },
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "eventId",
          "matchId",
          "seq",
          "version",
          "occurredAtMs",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "eventId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "matchId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "seq": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "version": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "occurredAtMs": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "type": {
            "const": "score.changed"
          },
          "payload": {
            "$ref": "urn:antakshari:score-entry:v1"
          },
          "metadata": {
            "type": "object",
            "maxProperties": 5,
            "properties": {
              "delivery_attempt": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "replay": {
                "type": "boolean"
              },
              "trace_sampled": {
                "type": "boolean"
              },
              "x_metric_resync": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "x_metric_delivery_latency_ms": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000000
              }
            },
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "eventId",
          "matchId",
          "seq",
          "version",
          "occurredAtMs",
          "type",
          "payload"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "eventId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "matchId": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          "seq": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "version": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "occurredAtMs": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "type": {
            "const": "match.finished"
          },
          "payload": {
            "type": "object",
            "properties": {
              "resultStatus": {
                "type": "string",
                "enum": [
                  "verified",
                  "provisional",
                  "abandoned"
                ]
              },
              "scores": {
                "type": "object",
                "properties": {
                  "A": {
                    "type": "integer"
                  },
                  "B": {
                    "type": "integer"
                  }
                },
                "required": [
                  "A",
                  "B"
                ],
                "additionalProperties": false
              }
            },
            "required": [
              "resultStatus",
              "scores"
            ],
            "additionalProperties": false
          },
          "metadata": {
            "type": "object",
            "maxProperties": 5,
            "properties": {
              "delivery_attempt": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "replay": {
                "type": "boolean"
              },
              "trace_sampled": {
                "type": "boolean"
              },
              "x_metric_resync": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000
              },
              "x_metric_delivery_latency_ms": {
                "type": "integer",
                "minimum": 0,
                "maximum": 1000000
              }
            },
            "required": [],
            "additionalProperties": false
          }
        },
        "required": [
          "schemaVersion",
          "eventId",
          "matchId",
          "seq",
          "version",
          "occurredAtMs",
          "type",
          "payload"
        ],
        "additionalProperties": false
      }
    ]
  },
  "error": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:error:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "code": {
        "type": "string",
        "enum": [
          "UNAUTHENTICATED",
          "PERMISSION_DENIED",
          "INVALID_ARGUMENT",
          "VERSION_CONFLICT",
          "NOT_READY",
          "ROOM_FULL",
          "INVITE_INVALID",
          "RATE_LIMITED",
          "TEMPORARILY_UNAVAILABLE",
          "BUDGET_EXHAUSTED",
          "STALE_ATTEMPT",
          "UPGRADE_REQUIRED"
        ]
      },
      "messageKey": {
        "type": "string",
        "minLength": 1,
        "maxLength": 128
      },
      "retryable": {
        "type": "boolean"
      },
      "retryAfterMs": {
        "anyOf": [
          {
            "type": "integer",
            "minimum": 0
          },
          {
            "type": "null"
          }
        ]
      },
      "currentVersion": {
        "anyOf": [
          {
            "type": "integer",
            "minimum": 0
          },
          {
            "type": "null"
          }
        ]
      },
      "requestId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      }
    },
    "required": [
      "schemaVersion",
      "code",
      "messageKey",
      "retryable",
      "retryAfterMs",
      "currentVersion",
      "requestId"
    ],
    "additionalProperties": false
  },
  "model-evidence": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:model-evidence:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "candidateId": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "sectionId": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "relation": {
        "type": "string",
        "enum": [
          "MATCH",
          "MISMATCH",
          "INSUFFICIENT"
        ]
      },
      "matchedSpanIds": {
        "type": "array",
        "items": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_-]{1,128}$"
        },
        "maxItems": 20
      },
      "contradictionCodes": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128
        },
        "maxItems": 10
      },
      "insufficientEvidence": {
        "type": "boolean"
      }
    },
    "required": [
      "schemaVersion",
      "candidateId",
      "sectionId",
      "relation",
      "matchedSpanIds",
      "contradictionCodes",
      "insufficientEvidence"
    ],
    "additionalProperties": false
  },
  "private-role-view": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:private-role-view:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "promptId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "recipientUid": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "expiryMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      },
      "role": {
        "const": "hummer"
      },
      "songId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "displayTitle": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      }
    },
    "required": [
      "schemaVersion",
      "promptId",
      "recipientUid",
      "expiryMs",
      "role",
      "songId",
      "displayTitle"
    ],
    "additionalProperties": false
  },
  "recording-grant": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:recording-grant:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "attemptId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "uid": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "matchId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "promptId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "generation": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      },
      "expiresAtMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      },
      "maxBytes": {
        "type": "integer",
        "minimum": 1,
        "maximum": 2000000
      },
      "sampleRate": {
        "type": "integer",
        "enum": [
          16000,
          24000
        ]
      },
      "direction": {
        "type": "string",
        "enum": [
          "capture",
          "listen"
        ]
      }
    },
    "required": [
      "schemaVersion",
      "attemptId",
      "uid",
      "matchId",
      "promptId",
      "generation",
      "expiresAtMs",
      "maxBytes",
      "sampleRate",
      "direction"
    ],
    "additionalProperties": false
  },
  "room-projection": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:room-projection:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "roomId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "version": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      },
      "mode": {
        "type": "string",
        "enum": [
          "1v1",
          "2v2"
        ]
      },
      "settingsVersion": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      },
      "ownerUid": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "packId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "preset": {
        "type": "string",
        "enum": [
          "standard6",
          "marathon10"
        ]
      },
      "partyReview": {
        "type": "boolean"
      },
      "activeMatchId": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "status": {
        "type": "string",
        "enum": [
          "lobby",
          "starting",
          "in_match",
          "closed"
        ]
      },
      "members": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "uid": {
              "type": "string",
              "pattern": "^[A-Za-z0-9_-]{1,128}$"
            },
            "displayName": {
              "type": "string",
              "minLength": 1,
              "maxLength": 40
            },
            "presetAvatarId": {
              "type": "string",
              "pattern": "^[A-Za-z0-9_-]{1,128}$"
            },
            "teamId": {
              "anyOf": [
                {
                  "type": "string",
                  "enum": [
                    "A",
                    "B"
                  ]
                },
                {
                  "type": "null"
                }
              ]
            },
            "seat": {
              "type": "integer",
              "minimum": 0,
              "maximum": 3
            },
            "ready": {
              "type": "boolean"
            },
            "readyVersion": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 9007199254740991
                },
                {
                  "type": "null"
                }
              ]
            },
            "micReady": {
              "type": "boolean"
            },
            "mediaReady": {
              "type": "boolean"
            }
          },
          "required": [
            "uid",
            "displayName",
            "presetAvatarId",
            "teamId",
            "seat",
            "ready",
            "readyVersion",
            "micReady",
            "mediaReady"
          ],
          "additionalProperties": false
        },
        "maxItems": 4
      }
    },
    "required": [
      "schemaVersion",
      "roomId",
      "version",
      "mode",
      "settingsVersion",
      "ownerUid",
      "packId",
      "preset",
      "partyReview",
      "activeMatchId",
      "status",
      "members"
    ],
    "additionalProperties": false
  },
  "round-config": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:round-config:v1",
    "oneOf": [
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R01"
          },
          "kind": {
            "const": "classic_chain"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 20000
          },
          "recordingLimitMs": {
            "const": 20000
          },
          "startSoundPolicy": {
            "const": "curated_phoneme"
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "startSoundPolicy"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R02"
          },
          "kind": {
            "const": "dhun_pehchano"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 8000
          },
          "recordingLimitMs": {
            "const": 15000
          },
          "cueDurationMs": {
            "type": "integer",
            "minimum": 3000,
            "maximum": 7000
          },
          "ownership": {
            "type": "string",
            "enum": [
              "assigned",
              "buzzer"
            ]
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "cueDurationMs",
          "ownership"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R03"
          },
          "kind": {
            "const": "antara_to_mukhda"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 15000
          },
          "recordingLimitMs": {
            "const": 20000
          },
          "requiredSection": {
            "const": "mukhda"
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "requiredSection"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R04"
          },
          "kind": {
            "const": "mukhda_to_antara"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 20000
          },
          "recordingLimitMs": {
            "const": 20000
          },
          "requiredSection": {
            "const": "any_approved_antara"
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "requiredSection"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R05"
          },
          "kind": {
            "const": "agla_bol"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 10000
          },
          "recordingLimitMs": {
            "const": 15000
          },
          "replayLimit": {
            "const": 1
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "replayLimit"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R06"
          },
          "kind": {
            "const": "shabd_se_geet"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 15000
          },
          "recordingLimitMs": {
            "const": 20000
          },
          "keywordPlan": {
            "type": "string",
            "enum": [
              "shared_word",
              "paired_words"
            ]
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "keywordPlan"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R07"
          },
          "kind": {
            "const": "hum_and_guess"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 10000
          },
          "recordingLimitMs": {
            "const": 20000
          },
          "requiredMode": {
            "const": "2v2"
          },
          "readyWindowMs": {
            "const": 10000
          },
          "humWindowMs": {
            "const": 20000
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "requiredMode",
          "readyWindowMs",
          "humWindowMs"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R08"
          },
          "kind": {
            "const": "two_song_fragments"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 15000
          },
          "recordingLimitMs": {
            "const": 0
          },
          "fragmentDurationMs": {
            "const": 4000
          },
          "gapMs": {
            "const": 500
          },
          "answerSlots": {
            "const": 2
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "fragmentDurationMs",
          "gapMs",
          "answerSlots"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R09"
          },
          "kind": {
            "const": "silent_video"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 12000
          },
          "recordingLimitMs": {
            "const": 20000
          },
          "silentDerivativeRequired": {
            "const": true
          },
          "ownership": {
            "type": "string",
            "enum": [
              "assigned",
              "buzzer"
            ]
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "silentDerivativeRequired",
          "ownership"
        ],
        "additionalProperties": false
      },
      {
        "type": "object",
        "properties": {
          "schemaVersion": {
            "const": 1
          },
          "roundId": {
            "const": "R10"
          },
          "kind": {
            "const": "picture_clue"
          },
          "primaryOpportunities": {
            "const": 4
          },
          "answerWindowMs": {
            "const": 15000
          },
          "recordingLimitMs": {
            "const": 20000
          },
          "maxRevealHints": {
            "const": 1
          }
        },
        "required": [
          "schemaVersion",
          "roundId",
          "kind",
          "primaryOpportunities",
          "answerWindowMs",
          "recordingLimitMs",
          "maxRevealHints"
        ],
        "additionalProperties": false
      }
    ]
  },
  "safe-cue": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:safe-cue:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "promptId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "roundId": {
        "type": "string",
        "enum": [
          "R01",
          "R02",
          "R03",
          "R04",
          "R05",
          "R06",
          "R07",
          "R08",
          "R09",
          "R10"
        ]
      },
      "assets": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "assetId": {
              "type": "string",
              "pattern": "^[A-Za-z0-9_-]{1,128}$"
            },
            "url": {
              "anyOf": [
                {
                  "type": "string",
                  "format": "uri",
                  "pattern": "^https://[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::[0-9]{1,5})?(?:/(?:[A-Za-z0-9._~!$&'()*+,;=:@/?-]|%[0-9A-Fa-f]{2})*)?$",
                  "maxLength": 2048
                },
                {
                  "type": "null"
                }
              ]
            },
            "expiresAtMs": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 9007199254740991
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "assetId",
            "url",
            "expiresAtMs"
          ],
          "additionalProperties": false
        },
        "maxItems": 4
      },
      "cueStartAtMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 9007199254740991
      },
      "allowedReplays": {
        "type": "integer",
        "minimum": 0,
        "maximum": 1
      },
      "instructionKey": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      }
    },
    "required": [
      "schemaVersion",
      "promptId",
      "roundId",
      "assets",
      "cueStartAtMs",
      "allowedReplays",
      "instructionKey"
    ],
    "additionalProperties": false
  },
  "safe-reveal": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:safe-reveal:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "promptId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "roundId": {
        "type": "string",
        "enum": [
          "R01",
          "R02",
          "R03",
          "R04",
          "R05",
          "R06",
          "R07",
          "R08",
          "R09",
          "R10"
        ]
      },
      "songs": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "songId": {
              "type": "string",
              "pattern": "^[A-Za-z0-9_-]{1,128}$"
            },
            "displayTitle": {
              "type": "string",
              "minLength": 1,
              "maxLength": 200
            },
            "sectionLabel": {
              "anyOf": [
                {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 80
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "songId",
            "displayTitle",
            "sectionLabel"
          ],
          "additionalProperties": false
        },
        "maxItems": 2
      },
      "explanationKey": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      }
    },
    "required": [
      "schemaVersion",
      "promptId",
      "roundId",
      "songs",
      "explanationKey"
    ],
    "additionalProperties": false
  },
  "score-entry": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:score-entry:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "entryId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "attemptId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "teamId": {
        "type": "string",
        "enum": [
          "A",
          "B"
        ]
      },
      "category": {
        "type": "string",
        "enum": [
          "identification",
          "singing",
          "steal",
          "hint",
          "penalty",
          "correction"
        ]
      },
      "requestedDelta": {
        "type": "integer",
        "minimum": -100,
        "maximum": 100
      },
      "appliedDelta": {
        "type": "integer",
        "minimum": -100,
        "maximum": 100
      },
      "capEffect": {
        "type": "string",
        "enum": [
          "none",
          "floor",
          "ceiling"
        ]
      },
      "reasonCode": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "correctionOf": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "rulesVersion": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      }
    },
    "required": [
      "schemaVersion",
      "entryId",
      "attemptId",
      "teamId",
      "category",
      "requestedDelta",
      "appliedDelta",
      "capEffect",
      "reasonCode",
      "correctionOf",
      "rulesVersion"
    ],
    "additionalProperties": false
  },
  "snapshot": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:snapshot:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "roomId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "matchId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "version": {
        "type": "integer",
        "minimum": 0
      },
      "seq": {
        "type": "integer",
        "minimum": 0
      },
      "phase": {
        "type": "string",
        "enum": [
          "lobby",
          "preparing",
          "countdown",
          "round_intro",
          "cue",
          "answer_open",
          "recording",
          "adjudicating",
          "reveal",
          "round_summary",
          "finished",
          "paused",
          "abandoned"
        ]
      },
      "phaseToken": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "roundId": {
        "anyOf": [
          {
            "type": "string",
            "enum": [
              "R01",
              "R02",
              "R03",
              "R04",
              "R05",
              "R06",
              "R07",
              "R08",
              "R09",
              "R10"
            ]
          },
          {
            "type": "null"
          }
        ]
      },
      "roundInstanceId": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "promptId": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "activeUid": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[A-Za-z0-9_-]{1,128}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "deadlineMs": {
        "anyOf": [
          {
            "type": "integer",
            "minimum": 0
          },
          {
            "type": "null"
          }
        ]
      },
      "serverNowMs": {
        "type": "integer",
        "minimum": 0
      },
      "scores": {
        "type": "object",
        "properties": {
          "A": {
            "type": "integer"
          },
          "B": {
            "type": "integer"
          }
        },
        "required": [
          "A",
          "B"
        ],
        "additionalProperties": false
      },
      "catalogueVersion": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "rulesVersion": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "resultStatus": {
        "type": "string",
        "enum": [
          "in_progress",
          "verified",
          "provisional",
          "abandoned"
        ]
      }
    },
    "required": [
      "schemaVersion",
      "roomId",
      "matchId",
      "version",
      "seq",
      "phase",
      "phaseToken",
      "roundId",
      "roundInstanceId",
      "promptId",
      "activeUid",
      "deadlineMs",
      "serverNowMs",
      "scores",
      "catalogueVersion",
      "rulesVersion",
      "resultStatus"
    ],
    "additionalProperties": false,
    "allOf": [
      {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "roundId": {
                "type": "null"
              },
              "roundInstanceId": {
                "type": "null"
              }
            },
            "required": [
              "roundId",
              "roundInstanceId"
            ],
            "additionalProperties": true
          },
          {
            "type": "object",
            "properties": {
              "roundId": {
                "type": "string",
                "enum": [
                  "R01",
                  "R02",
                  "R03",
                  "R04",
                  "R05",
                  "R06",
                  "R07",
                  "R08",
                  "R09",
                  "R10"
                ]
              },
              "roundInstanceId": {
                "type": "string",
                "pattern": "^[A-Za-z0-9_-]{1,128}$"
              }
            },
            "required": [
              "roundId",
              "roundInstanceId"
            ],
            "additionalProperties": true
          }
        ]
      },
      {
        "if": {
          "type": "object",
          "properties": {
            "phase": {
              "not": {
                "type": "string",
                "enum": [
                  "lobby",
                  "preparing",
                  "countdown",
                  "finished",
                  "abandoned"
                ]
              }
            }
          },
          "required": [
            "phase"
          ]
        },
        "then": {
          "type": "object",
          "properties": {
            "roundId": {
              "type": "string",
              "enum": [
                "R01",
                "R02",
                "R03",
                "R04",
                "R05",
                "R06",
                "R07",
                "R08",
                "R09",
                "R10"
              ]
            },
            "roundInstanceId": {
              "type": "string",
              "pattern": "^[A-Za-z0-9_-]{1,128}$"
            }
          },
          "required": [
            "roundId",
            "roundInstanceId"
          ]
        }
      }
    ]
  },
  "task-result": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:task-result:v1",
    "type": "object",
    "properties": {
      "schema_version": {
        "const": 1
      },
      "task_id": {
        "type": "string",
        "pattern": "^(BOOT-[0-9]{3}|[CR][0-9]{2}-[0-9]{2}-[IUAX])$"
      },
      "worker": {
        "type": "string",
        "minLength": 1,
        "maxLength": 128
      },
      "batch_id": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "status": {
        "type": "string",
        "enum": [
          "implemented",
          "blocked",
          "failed"
        ]
      },
      "base_sha": {
        "type": "string",
        "pattern": "^[a-f0-9]{40}$"
      },
      "implementation_sha": {
        "anyOf": [
          {
            "type": "string",
            "pattern": "^[a-f0-9]{40}$"
          },
          {
            "type": "null"
          }
        ]
      },
      "summary": {
        "type": "string",
        "minLength": 10,
        "maxLength": 5000
      },
      "changed_files": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128
        },
        "maxItems": 200
      },
      "checks": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "command": {
              "type": "string",
              "minLength": 1,
              "maxLength": 128
            },
            "exit_code": {
              "type": "integer"
            },
            "log_path": {
              "type": "string",
              "minLength": 1,
              "maxLength": 128
            },
            "environment": {
              "type": "string",
              "minLength": 1,
              "maxLength": 128
            }
          },
          "required": [
            "command",
            "exit_code",
            "log_path",
            "environment"
          ],
          "additionalProperties": false
        },
        "maxItems": 30
      },
      "blockers": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128
        },
        "maxItems": 20
      },
      "remaining_risks": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128
        },
        "maxItems": 20
      },
      "provider_mode": {
        "type": "string",
        "enum": [
          "not_used",
          "fake",
          "live"
        ]
      },
      "evidence_paths": {
        "type": "array",
        "items": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128
        },
        "maxItems": 30
      }
    },
    "required": [
      "schema_version",
      "task_id",
      "worker",
      "batch_id",
      "status",
      "base_sha",
      "implementation_sha",
      "summary",
      "changed_files",
      "checks",
      "blockers",
      "remaining_risks",
      "provider_mode",
      "evidence_paths"
    ],
    "additionalProperties": false
  },
  "transcript-evidence": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:antakshari:transcript-evidence:v1",
    "type": "object",
    "properties": {
      "schemaVersion": {
        "const": 1
      },
      "attemptId": {
        "type": "string",
        "pattern": "^[A-Za-z0-9_-]{1,128}$"
      },
      "model": {
        "const": "muse-voice-transcribe-1.0"
      },
      "text": {
        "type": "string",
        "maxLength": 8000
      },
      "final": {
        "type": "boolean"
      },
      "observedAudioDurationMs": {
        "type": "integer",
        "minimum": 0,
        "maximum": 20000
      },
      "mode": {
        "type": "string",
        "enum": [
          "PUSH_TO_TALK",
          "CONTINUOUS"
        ]
      },
      "language": {
        "type": "string",
        "minLength": 1,
        "maxLength": 32
      },
      "turns": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "text": {
              "type": "string",
              "maxLength": 8000
            },
            "language": {
              "type": "string",
              "minLength": 1,
              "maxLength": 32
            }
          },
          "required": [
            "text"
          ],
          "additionalProperties": false
        },
        "maxItems": 50
      },
      "captureTiming": {
        "type": "object",
        "properties": {
          "origin": {
            "const": "application_capture"
          },
          "startAtMs": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          },
          "endAtMs": {
            "type": "integer",
            "minimum": 0,
            "maximum": 9007199254740991
          }
        },
        "required": [
          "origin",
          "startAtMs",
          "endAtMs"
        ],
        "additionalProperties": false
      }
    },
    "required": [
      "schemaVersion",
      "attemptId",
      "model",
      "text",
      "final",
      "observedAudioDurationMs",
      "mode"
    ],
    "additionalProperties": false
  }
};
