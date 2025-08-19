export const IDEMP_LUA = `
local v = redis.call('GET', KEYS[1])
if not v then
  redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
  return 1
elseif v == ARGV[1] then
  return 0
else
  return -1
end
`;
