export function generateTestXRayData(deviceId: string = 'test-device-001') {
  const now = Date.now();

  return {
    [deviceId]: {
      data: [
        [now, [51.5074, -0.1278, 1.5]],
        [now + 1000, [51.5075, -0.1279, 2.1]],
        [now + 2000, [51.5076, -0.128, 1.8]],
      ],
      time: now,
    },
  };
}
