/* global it describe expect */

const pathFinder = require('./');

describe('pathFinder()', () => {
  describe('given `componentPath`', () => {
    const path = '.' + 'hello'.repeat(Math.random() * 19);

    const sourceTestCases = [
      `export default { componentPath: '${path}' }`,

      `const config = {
        componentPath: '${path}'
      };
      export default config;
      `,
    ];

    sourceTestCases.map(source =>
      it('should resolve promise with value of `componentPath`', () =>
        expect(pathFinder(source)).resolves.toEqual(path))
    );
  });

  describe('given incomplete story config', () => {
    it('should fail with error', () => {
      const source = 'export default { sections: [] };';
      return expect(pathFinder(source)).rejects.toEqual(
        new Error(
          'ERROR: unable to resolve component path. Ensure exported story config has `componentPath` property with correct relative path to component implementation'
        )
      );
    });
  });

  describe('given `component` without `componentPath`', () => {
    describe('when `component` is imported', () => {
      const path = './path';
      const sourceTestCases = [
        `import Component from '${path}';
        export default {
          component: Component
        }`,

        `import * as Component from '${path}'
        export default {
          component: Component
        }`,

        `import {Component} from '${path}'
        export default {
          component: Component
        }`,

        `import {Component, Something, Different} from '${path}'
        export default {
          component: Component
        }`,

        `import {Component as ComponentAlias} from '${path}'
        export default {
          component: ComponentAlias
        }`,

        `import defaultExport, {Component as ComponentAlias} from '${path}'
        export default {
          component: ComponentAlias
        }`,
      ];

      sourceTestCases.map(source =>
        it('should resolve promise with path to component', () => expect(pathFinder(source)).resolves.toEqual(path))
      );
    });
  });
});
