const paginate = async <PARAMS, RETURN extends { data: unknown[] }>(
  func: (params: PARAMS & { page: number }) => Promise<RETURN>,
  params: PARAMS
): Promise<RETURN['data']> => {
  let page = 1;
  const result: RETURN['data'] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await func({ ...params, page });
    if (!data.length) {
      break;
    } else {
      result.push(...data);
      page++;
    }
  }

  return result;
};

export const Utils = { paginate };
