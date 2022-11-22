import { describe, it, vi, expect, beforeEach } from 'vitest';
import { CLI } from '../src/brocolito';
import { Utils } from '../src/utils';

const call = (line: string) => {
  CLI.parse(['nodeFile', 'scriptFile'].concat(line.split(' ')));
};

describe('Example commands', () => {
  beforeEach(() => {
    vi.spyOn(Utils, 'complainAndExit').mockImplementation((errMsg) => {
      throw new Error(errMsg);
    });
  });

  it('Simple command without options', () => {
    // given
    const spy = vi.fn();
    CLI.command('example-1', 'example-1-description').action(spy);

    // when
    call('example-1');

    // then
    expect(spy).toHaveBeenCalledOnce();
  });

  it('Subcommand', () => {
    // given
    const fooSpy = vi.fn();
    const barSpy = vi.fn();
    CLI.command('example-2', 'example-2-description')
      .subcommand('foo', 'foo-desc', (foo) => {
        foo.action(fooSpy);
      })
      .subcommand('bar', 'bar-desc', (bar) => {
        bar.action(barSpy);
      });

    // when
    call('example-2 bar');

    // then
    expect(fooSpy).not.toHaveBeenCalled();
    expect(barSpy).toHaveBeenCalledOnce();
  });

  it('Two level subcommands', () => {
    // given
    const spy = vi.fn();
    const fooSpy = vi.fn();
    const barSpy = vi.fn();
    CLI.command('example-3', 'example-3-description')
      .subcommand('foo', 'foo-desc', (foo) => {
        foo
          .subcommand('bar', 'bar-desc', (bar) => {
            bar.action(barSpy);
          })
          .action(fooSpy);
      })
      .action(spy);

    // when
    call('example-3');

    // then
    expect(spy).toHaveBeenCalledOnce();
    expect(fooSpy).not.toHaveBeenCalled();
    expect(barSpy).not.toHaveBeenCalled();

    // when
    vi.resetAllMocks();
    call('example-3 foo');

    // then
    expect(spy).not.toHaveBeenCalled();
    expect(fooSpy).toHaveBeenCalledOnce();
    expect(barSpy).not.toHaveBeenCalled();

    // when
    vi.resetAllMocks();
    call('example-3 foo bar');

    // then
    expect(spy).not.toHaveBeenCalled();
    expect(fooSpy).not.toHaveBeenCalled();
    expect(barSpy).toHaveBeenCalledOnce();
  });

  it('parses options', () => {
    // given
    const spy = vi.fn();
    CLI.command('example-4', 'example-4-description')
      .option('--test <test_arg>', 'test option')
      .option('--some-more', 'some-more option')
      .action(({ test, someMore, ...rest }) => spy({ test, someMore, ...rest }));

    // when - called with no options
    call('example-4');

    // then
    expect(spy).toHaveBeenCalledWith({});

    // when
    spy.mockReset();
    call('example-4 --test foo --some-more=bar');

    // then FIXME parse "someMore" as boolean
    expect(spy).toHaveBeenCalledWith({ test: 'foo', someMore: 'bar' });

    // when - called with invalid options
    expect(() => call('example-4 --invalid=foo')).toThrow('Unrecognized options were used: --invalid');

    // when - called with invalid options and valid options
    expect(() => call('example-4 --invalid=foo --test foo --what else')).toThrow(
      'Unrecognized options were used: --invalid, --what'
    );
  });

  it('parses args and options', () => {
    // given
    const spy = vi.fn();
    const subcommandSpy = vi.fn();
    CLI.command('example-5', 'example-5-description')
      .option('--open', 'test option')
      .arg('<test-arg>', 'some-more option')
      .subcommand('foo', 'foo-desc', (foo) => {
        foo.arg('<what>', 'test desc').action(({ open, what, ...rest }) => subcommandSpy({ open, what, ...rest }));
      })
      .option('--test <param>', 'test option')
      .arg('<test-multi...>', 'some-more option')
      .action(({ test, testArg, open, testMulti, ...rest }) => {
        spy({ test, testArg, open, testMulti, ...rest });
      });

    // when
    call('example-5 ./some/path hot hotter lotta --test=ups --open');

    // then
    expect(spy).toHaveBeenCalledWith({
      test: 'ups',
      open: true,
      testArg: './some/path',
      testMulti: ['hot', 'hotter', 'lotta'],
    });

    // when - calling the sub command
    call('example-5 foo --open=false hot');

    // then FIXME parse "open" as boolean
    expect(subcommandSpy).toHaveBeenCalledWith({ what: 'hot', open: 'false' });
  });
});
