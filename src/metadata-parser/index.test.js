/* global Promise describe it expect jest afterEach */

const metadataParser = require('./');

jest.mock('fs');
const fs = require('fs');

const rootMock = {
  description: '',
  methods: []
};

describe('metadataParser()', () => {
  it('should be a function', () => {
    expect(typeof metadataParser).toBe('function');
  });

  describe('when called without parameters', () => {
    it('should reject with error', () => {
      return metadataParser().catch(error => {
        expect(error).toEqual(new Error('ERROR: Missing required `path` argument'));
      });
    });
  });

  describe('given existing path', () => {
    afterEach(() => fs.__reset());

    describe('with component source', () => {
      describe('that has no useful data', () => {
        it('should return initial object for functional component', () => {
          const [path, source] = [
            'simple-functional.js',

            `import React from 'react';
             export default () => <div>Hello World!</div>;`
          ];

          fs.__setFile(path)(source);

          return expect(metadataParser(path)).resolves.toEqual(rootMock);
        });

        it('should return initial object for class component', () => {
          const [path, source] = [
            'simple-class.js',

            `import React from 'react';
             export default class extends React.Component {
               render() { return <div></div>; }
             }`
          ];

          fs.__setFile(path)(source);

          return expect(metadataParser(path)).resolves.toEqual(rootMock);
        });
      });

      describe('that has props', () => {
        it('should return correct object for functional component', () => {
          const [path, source] = [
            'functional-with-props.js',

            `import React from 'react';
            import PropTypes from 'prop-types';
            const component = () => <div></div>;
            component.propTypes = {
              /** hello comment */
              hello: PropTypes.bool,

              /** goodbye comment */
              goodbye: PropTypes.string.isRequired,

              /** Mr. Deez
               *  Nuts
               *  */
              nuts: PropTypes.oneOf(['deez', 'deeez'])
            };
            export default component;
            `
          ];

          fs.__setFile(path)(source);

          return expect(metadataParser(path)).resolves.toEqual({
            description: '',
            methods: [],
            props: {
              hello: {
                description: 'hello comment',
                required: false,
                type: { name: 'bool' }
              },

              goodbye: {
                description: 'goodbye comment',
                required: true,
                type: { name: 'string' }
              },

              nuts: {
                description: 'Mr. Deez\n Nuts',
                required: false,
                type: {
                  name: 'enum',
                  value: [
                    { computed: false, value: "'deez'" },
                    { computed: false, value: "'deeez'" }
                  ]
                }
              },


            }
          });
        });

        it('should return correct object for class component', () => {
          const [path, source] = [
            'class-with-props.js',

            `import React from 'react';
            import PropTypes from 'prop-types';
            export default class Component extends React.Component {
              static propTypes = {
                /** hello comment */
                hello: PropTypes.bool,

                /** goodbye comment */
                goodbye: PropTypes.string.isRequired,

                /** Mr. Deez
                *  Nuts
                *  */
                nuts: PropTypes.oneOf(['deez', 'deeez'])
              };

              render() {
                return '';
              }
            }
            `
          ];

          fs.__setFile(path)(source);

          return expect(metadataParser(path)).resolves.toEqual({
            description: '',
            methods: [],
            displayName: 'Component',
            props: {
              hello: {
                description: 'hello comment',
                required: false,
                type: { name: 'bool' }
              },

              goodbye: {
                description: 'goodbye comment',
                required: true,
                type: { name: 'string' }
              },

              nuts: {
                description: 'Mr. Deez\n Nuts',
                required: false,
                type: {
                  name: 'enum',
                  value: [
                    { computed: false, value: "'deez'" },
                    { computed: false, value: "'deeez'" }
                  ]
                }
              },
            }
          });
        });
      });

      describe('that has spread props', () => {
        it('should return correct object for functional component', () => {
          const pathsAndSources = [
            [
              'spread-functional.js',

              `import React from 'react';
             import PropTypes from 'prop-types';
             import moreProps from './more-props.js';
             import evenMoreProps from './even-more-props.js';
             const component = () => <div>Hello World!</div>;
             component.propTypes = {
                ...moreProps,
                ...evenMoreProps,
                shapeProp: PropTypes.shape({
                  stringProp: PropTypes.string,
                  funcProp: PropTypes.func.isRequired
                })
             };
             export default component;
            `
            ],
            [
              'more-props.js',
              `
            import React from 'react';
            import PropTypes from 'prop-types';
            const component = ({propFromAnotherFile}) => <div></div>;
            component.propTypes = {
              propFromAnotherFile: PropTypes.bool.isRequired
            };
            export default component;
            `
            ],
            [
              'even-more-props.js',
              `
            import React from 'react';
            import PropTypes from 'prop-types';
            const component = ({ propFromYetAnotherFile }) => <div></div>;
            component.propTypes = {
              propFromYetAnotherFile: PropTypes.string.isRequired
            };
            export default component;
            `
            ]
          ];

          pathsAndSources.forEach(([path, source]) => fs.__setFile(path)(source));

          return expect(metadataParser(pathsAndSources[0][0])).resolves.toEqual({
            ...rootMock,
            props: {
              propFromAnotherFile: {
                description: '',
                type: {
                  name: 'bool'
                },
                required: true
              },
              propFromYetAnotherFile: {
                description: '',
                type: {
                  name: 'string'
                },
                required: true
              },
              shapeProp: {
                description: '',
                required: false,
                type: {
                  name: 'shape',
                  value: {
                    funcProp: {
                      name: 'func',
                      required: true
                    },
                    stringProp: {
                      name: 'string',
                      required: false
                    }
                  }
                }
              }
            }
          });
        });
      });
    });

    describe('with `export default from ...`', () => {
      it('should follow that export', () => {
        const pathsAndSources = [
          [
            'index.js',
            'export {default} from \'./component.js\';'
          ],
          [
            'component.js',
            `
              /** I am the one who props */
              const component = () => <div/>;
              export default component;
            `
          ]
        ];

        pathsAndSources.map(([path, source]) => fs.__setFile(path)(source));

        return expect(metadataParser(pathsAndSources[0][0])).resolves.toEqual({
          description: 'I am the one who props',
          methods: []
        });
      });

      it('should follow many nested exports', () => {
        const pathsAndSources = [
          [
            'index.js',
            'export {default} from \'./sibling.js\''
          ],
          [
            'sibling.js',
            'export {default} from \'./nested/deep/component.js\''
          ],
          [
            'nested/deep/component.js',
            'export {default} from \'../component.js\''
          ],
          [
            'nested/component.js',
            `
              /** You got me */
              const component = () => <div/>;
              export default component;
            `
          ]
        ];

        pathsAndSources.map(([path, source]) => fs.__setFile(path)(source));

        return expect(metadataParser(pathsAndSources[0][0])).resolves.toEqual({
          description: 'You got me',
          methods: []
        });
      });
    });
  });
});
