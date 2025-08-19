export const XRaySchemaUnion = {
  anyOf: [
    {
      type: 'object',
      required: ['deviceId', 'data', 'time'],
      additionalProperties: false,
      properties: {
        deviceId: { type: 'string', pattern: '^[a-f0-9]{24}$' },
        time: { type: 'integer', minimum: 0 },
        data: {
          type: 'array',
          items: {
            type: 'array',
            minItems: 2,
            maxItems: 2,
            items: [
              { type: 'number' }, // sample-relative ts/ms
              {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: [
                  { type: 'number', minimum: -90, maximum: 90 }, // lat
                  { type: 'number', minimum: -180, maximum: 180 }, // lon
                  { type: 'number', minimum: 0 }, // speed >= 0
                ],
              },
            ],
          },
        },
      },
    },
    {
      // Raw format: {"<deviceId>": { data, time }}
      type: 'object',
      minProperties: 1,
      additionalProperties: {
        type: 'object',
        required: ['data', 'time'],
        additionalProperties: false,
        properties: {
          time: { type: 'integer', minimum: 0 },
          data: {
            type: 'array',
            items: {
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: [
                { type: 'number' },
                {
                  type: 'array',
                  minItems: 3,
                  maxItems: 3,
                  items: [
                    { type: 'number', minimum: -90, maximum: 90 },
                    { type: 'number', minimum: -180, maximum: 180 },
                    { type: 'number', minimum: 0 },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  ],
};
