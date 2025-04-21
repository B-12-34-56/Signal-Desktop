// Copyright 2024 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import fs from 'fs/promises';
import { createHash } from 'crypto';
import path from 'path';
import ts from 'typescript';
import prettier from 'prettier';

import { getICUMessageParams } from '../util/getICUMessageParams';
import type { ICUMessageParamType } from '../util/getICUMessageParams';
import { missingCaseError } from '../util/missingCaseError';
import globalMessagesJson from '../../_locales/en/messages.json';

// Define the expected shape of each message descriptor
interface MessageDescriptor {
  messageformat: string;
  description: string;
}

// Cast imported JSON to the expected type
const globalMessages: Record<string, MessageDescriptor> = globalMessagesJson as any;

import { DELETED_REGEXP } from './constants';

function translateParamType(
  param: ICUMessageParamType,
  stringType: ts.TypeNode,
  componentType: ts.TypeNode
): ts.TypeNode {
  switch (param.type) {
    case 'string':
      return stringType;
    case 'number':
      return ts.factory.createToken(ts.SyntaxKind.NumberKeyword);
    case 'date':
    case 'time':
      return ts.factory.createTypeReferenceNode('Date');
    case 'jsx':
      return componentType;
    case 'select':
      return ts.factory.createUnionTypeNode(
        param.validOptions.map(option => {
          if (option === 'other') {
            return stringType;
          }
          return ts.factory.createLiteralTypeNode(
            ts.factory.createStringLiteral(option, true)
          );
        })
      );
    default:
      throw missingCaseError(param);
  }
}

const messageKeys = Object.keys(globalMessages).sort((a, b) => a.localeCompare(b));

function filterDefaultParams(params: Map<string, ICUMessageParamType>) {
  const filteredParams = new Map<string, ICUMessageParamType>();
  for (const [key, value] of params) {
    if (key === 'emojify') continue;
    filteredParams.set(key, value);
  }
  return filteredParams;
}

const ComponentOrStringNode = ts.factory.createTypeReferenceNode('ComponentOrString');
const ComponentNode = ts.factory.createTypeReferenceNode('Component');
const StringToken = ts.factory.createToken(ts.SyntaxKind.StringKeyword);
const NeverToken = ts.factory.createToken(ts.SyntaxKind.NeverKeyword);

function generateType(name: string, supportsComponents: boolean): ts.Statement {
  const props: ts.TypeElement[] = [];

  for (const key of messageKeys) {
    if (key === 'smartling') continue;

    const message = globalMessages[key];
    if ('description' in message && DELETED_REGEXP.test(message.description)) continue;

    const { messageformat } = message;

    // Skip if messageformat is empty or invalid
    if (typeof messageformat !== 'string' || messageformat.trim().length === 0) {
      console.warn(`Skipping empty ICU message for key ${key}`);
      continue;
    }

    let rawParams: Map<string, ICUMessageParamType>;
    try {
      rawParams = getICUMessageParams(messageformat);
    } catch (e) {
      console.warn(`Invalid ICU syntax in message for key ${key}, skipping.`, e);
      continue;
    }

    const params = filterDefaultParams(rawParams);

    if (!supportsComponents) {
      const needsComponents = Array.from(rawParams.values()).some(v => v.type === 'jsx');
      if (needsComponents) continue;
    }

    const stringType = supportsComponents ? ComponentOrStringNode : StringToken;
    const componentType = supportsComponents ? ComponentNode : NeverToken;

    let paramType: ts.TypeNode;
    if (params.size === 0) {
      paramType = ts.factory.createToken(ts.SyntaxKind.UndefinedKeyword);
    } else {
      const subTypes: ts.TypeElement[] = [];
      for (const [paramName, value] of params) {
        subTypes.push(
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createStringLiteral(paramName, true),
            undefined,
            translateParamType(value, stringType, componentType)
          )
        );
      }
      paramType = ts.factory.createTypeLiteralNode(subTypes);
    }

    props.push(
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createStringLiteral(key, true),
        undefined,
        paramType
      )
    );
  }

  return ts.factory.createTypeAliasDeclaration(
    [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
    name,
    undefined,
    ts.factory.createTypeLiteralNode(props)
  );
}

const statements: ts.Statement[] = [];

let top = ts.factory.createImportDeclaration(
  undefined,
  ts.factory.createImportClause(true, undefined,
    ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('ReactNode'))
    ])
  ),
  ts.factory.createStringLiteral('react')
);

top = ts.addSyntheticLeadingComment(
  top,
  ts.SyntaxKind.SingleLineCommentTrivia,
  ` Copyright ${new Date().getFullYear()} Signal Messenger, LLC`
);
top = ts.addSyntheticLeadingComment(
  top,
  ts.SyntaxKind.SingleLineCommentTrivia,
  ' SPDX-License-Identifier: AGPL-3.0-only'
);
statements.push(top);

const JSXElement = ts.factory.createTypeReferenceNode(
  ts.factory.createQualifiedName(ts.factory.createIdentifier('JSX'), 'Element')
);

statements.push(
  ts.factory.createTypeAliasDeclaration(
    undefined,
    'Component',
    undefined,
    ts.factory.createUnionTypeNode([
      JSXElement,
      ts.factory.createFunctionTypeNode(
        undefined,
        [ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          'parts',
          undefined,
          ts.factory.createTypeReferenceNode('Array', [
            ts.factory.createUnionTypeNode([
              ts.factory.createToken(ts.SyntaxKind.StringKeyword),
              JSXElement,
            ]),
          ])
        )],
        JSXElement
      ),
    ])
  )
);

statements.push(
  ts.factory.createTypeAliasDeclaration(
    undefined,
    'ComponentOrString',
    undefined,
    ts.factory.createUnionTypeNode([
      ts.factory.createToken(ts.SyntaxKind.StringKeyword),
      ts.factory.createTypeReferenceNode('ReadonlyArray', [
        ts.factory.createUnionTypeNode([
          ts.factory.createToken(ts.SyntaxKind.StringKeyword),
          JSXElement,
        ]),
      ]),
      ts.factory.createTypeReferenceNode('Component'),
    ])
  )
);

statements.push(generateType('ICUJSXMessageParamsByKeyType', true));
statements.push(generateType('ICUStringMessageParamsByKeyType', false));

const root = ts.factory.createSourceFile(
  statements,
  ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None
);

const resultFile = ts.createSourceFile(
  'icuTypes.d.ts',
  '',
  ts.ScriptTarget.Latest,
  false,
  ts.ScriptKind.TS
);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const unformattedOutput = printer.printNode(ts.EmitHint.Unspecified, root, resultFile);

async function main() {
  const destinationPath = path.join(__dirname, '..', '..', 'build', 'ICUMessageParams.d.ts');

  let oldHash: string | undefined;
  try {
    oldHash = createHash('sha512')
      .update(await fs.readFile(destinationPath))
      .digest('hex');
  } catch {
    // ignore
  }

  const prettierConfig = await prettier.resolveConfig(destinationPath);
  const output = await prettier.format(unformattedOutput, {
    ...prettierConfig,
    filepath: destinationPath,
  });

  const newHash = createHash('sha512').update(output).digest('hex');
  if (oldHash === newHash) {
    console.log('ICUMessageParams.d.ts is unchanged');
  }

  await fs.writeFile(destinationPath, output);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
