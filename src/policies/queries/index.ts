import { getPayloadContext } from '@/shared/utils/getPayloadContext'

export const getLastPolicyVersion = async () => {
  const { payload } = await getPayloadContext();

  const { docs: [lastPolicy] = [] } = await payload.find({
    collection: 'policies',
    sort: '-version',
    limit: 1,
  });

  return lastPolicy ?? null;
};
