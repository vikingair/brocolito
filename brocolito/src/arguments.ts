import { ArgumentToName, SnakeToCamelCase } from './types';

const camelize = <S extends string>(str: S): SnakeToCamelCase<S> =>
  str.replace(/(-[a-zA-Z])/g, (w) => w[1].toUpperCase()) as SnakeToCamelCase<S>;

const toName = <S extends string>(str: S): ArgumentToName<S> =>
  camelize(str.replace(/^<(file:)?([a-zA-Z0-9-]+)(\.{3})?>$/, '$2')) as ArgumentToName<S>;

const deriveInfo = (usage: string): { type: 'boolean' | 'string' | 'file'; multi: boolean } => {
  const match = usage.match(/^<(file:)?[a-zA-Z0-9-]+(\.{3})?>$/);
  if (!match) return { type: 'boolean', multi: false };
  return {
    type: match[1] ? 'file' : 'string',
    multi: !!match[2],
  };
};

const deriveOptionInfo = (usage: string): { type: 'boolean' | 'string' | 'file'; multi: boolean } => {
  const [_name, arg] = usage.split(' ');
  const match = arg && arg.match(/^<([a-zA-Z0-9-]+)(\.{3})?>$/);
  if (!match) return { type: 'boolean', multi: false };
  return {
    type: match[1] === 'file' ? 'file' : 'string',
    multi: !!match[2],
  };
};

export const Arguments = { camelize, toName, deriveInfo, deriveOptionInfo };
