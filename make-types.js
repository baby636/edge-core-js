#!/usr/bin/env node

const babel = require('@babel/core')
const flowgen = require('flowgen')
const fs = require('fs')
const prettier = require('prettier')

function tsToFlow(filename) {
  let flow = flowgen.compiler.compileDefinitionFile(filename, {
    inexact: false,
    interfaceRecords: true
  })
  const header = '// @flow\n' + '/* eslint-disable no-use-before-define */\n'
  flow = prettier.format(header + flow, {
    parser: 'babel',
    semi: false,
    singleQuote: true
  })
  flow = flow.replace(/import {/g, 'import type {')
  flow = flow.replace(/declare export {/, 'export type {')
  return flow
}

// Assemble the Flow types:
let flowTypes = tsToFlow('./src/types/types.ts')
flowTypes = flowTypes.replace(/'.\/error'/, "'./error.js.flow'")
flowTypes += '\n' + fs.readFileSync('src/types/entries.js.flow', 'utf8')
fs.writeFileSync('./index.js.flow', flowTypes)
fs.writeFileSync('./types.js.flow', flowTypes)
const errorTypes = tsToFlow('./src/types/error.ts')
fs.writeFileSync('./error.js.flow', errorTypes)

// Transpile errors to plain Javascript:
const errorJs = babel.transformFileSync('src/types/error.ts', {
  presets: ['@babel/preset-typescript'],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    'babel-plugin-transform-fake-error-class'
  ]
}).code
fs.writeFileSync('types.js', errorJs)
