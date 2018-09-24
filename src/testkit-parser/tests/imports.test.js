const getExport = require('../get-export');
const fsTree = require('./utils/fs-tree');

jest.mock('fs');
const fs = require('fs');

describe('import parsing', () => {
  const testCases = [
    { spec: 'default arrow function without block statement',
      code: `
      import driver from './driver.js';
      export default () => ({
        driver
      })`,
      files: {
        './driver.js': `export default () => ({
          method: arg => {}
        })`
      }
    },
    { spec: 'default arrow function with block statement',
      code: `
      import driver from './driver.js';
      export default () => ({
        driver
      })`,
      files: {
        './driver.js': `export default () => {
           return {
             method: arg => {}
           }
        }`
      }
    },
    { spec: 'default function',
      code: `
      import driver from './driver.js';
      export default () => ({
        driver
      })`,
      files: {
        './driver.js': `export default function() {
           return {
             method: arg => {}
           }
        }`
      }
    },
    { spec: 'identifier in imported file',
      code: `
      import driver from './driver.js';
      export default () => ({
        driver
      })`,
      files: {
        './driver.js': `
         const symbol = {
           method: arg => {}
         };
         export default function() {
           return symbol;
         }`
      }
    },
    { spec: 'named arrow function',
      code: `
      import {driver} from './driver.js';
      export default () => ({
        driver
      })`,
      files: {
        './driver.js': `
          export const driver = () => ({
            method: arg => {}
          });
          export default () => ({
            anotherMethod: () => {}
          })`
      }
    },
    { spec: 'factory function',
      code: `
      import driverFactory from './driver.js';
      const driver = driverFactory();
      export default () => ({
        driver
      })`,
      files: {
        './driver.js': `
          export default () => ({
            method: arg => {}
          })`
      }
    },
    { spec: 'member expression',
      code: `
      import driverFactory from './driver.js';
      export default () => ({
        driver: driverFactory().anotherDriver
      })`,
      files: {
        './driver.js': `
          export default () => ({
            anotherDriver: {
              method: arg => {}
            }
          })`
      }
    },
    { spec: 'object spread on factory function',
      code: `
      import driverFactory from './driver.js';
      export default () => ({
        ...driverFactory()
      })
      `,
      files: {
        './driver.js': `
          export default () => ({
            driver: {
              method: arg => {}
            }
          })
        `
      }
    },
    { spec: 'export { x as y } from z',
      code: `
        export { internalDriver as driverFactory } from './driver.js';
      `,
      files: {
        './driver.js': `
        export const internalDriver = () => ({
          driver: {
            method: arg => {}
          }
        });
        `
      }
    }
  ];

  const expected = [
    { name: 'driver', type: 'object', props: [
      { name: 'method', type: 'function', args: [{ name: 'arg' }]}
    ]}
  ];

  testCases.forEach(({spec, code, files}) => {
    it(`should parse ${spec}`, async () => {
      fs.__setFS(fsTree(files));
      const result = await getExport(code);
      expect(result).toEqual(expected);
    });
  });
});