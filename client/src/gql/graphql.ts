/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
import type { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type GuideDetailsQueryVariables = Exact<{
  slug: string;
}>;

export type GuideDetailsQuery = {
  guide: {
    title: string;
    region: string;
    difficulty: string;
    lengthKm: number;
    bodyHtml: string;
    notices: Array<{
      id: string;
      title: string;
      level: string;
      status: string;
      guideSlug: string | null;
      body: Array<{
        runs: Array<{
          text: string;
          bold: boolean;
          italic: boolean;
          href: string | null;
        }>;
      }>;
    }>;
  } | null;
};

export type GuidesPageQueryVariables = Exact<{
  preview: boolean;
}>;

export type GuidesPageQuery = {
  guides: Array<{
    id: string;
    slug: string;
    title: string;
    region: string;
    difficulty: string;
    lengthKm: number;
    bodyHtml: string;
  }>;
  notices: Array<{
    id: string;
    title: string;
    level: string;
    status: string;
    guideSlug: string | null;
    body: Array<{
      runs: Array<{
        text: string;
        bold: boolean;
        italic: boolean;
        href: string | null;
      }>;
    }>;
  }>;
};

export type MinaTurerQueryVariables = Exact<{ [key: string]: never }>;

export type MinaTurerQuery = {
  tours: Array<{ id: string; title: string; user: { id: string } }>;
};

export type TourDetailsQueryVariables = Exact<{
  id: string | number;
}>;

export type TourDetailsQuery = {
  tour: {
    title: string;
    distanceM: number;
    notes: string | null;
    logs: Array<{
      recordedAt: string;
      elevationM: number | null;
      heartRate: number | null;
    }>;
  } | null;
};

export type TurerQueryVariables = Exact<{ [key: string]: never }>;

export type TurerQuery = {
  tours: Array<{
    id: string;
    title: string;
    distanceM: number;
    user: { displayName: string };
    guide: { title: string } | null;
    photos: Array<{ id: string }>;
  }>;
};

export const GuideDetailsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "GuideDetails" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "slug" } },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "String" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "guide" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "slug" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "slug" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "title" } },
                { kind: "Field", name: { kind: "Name", value: "region" } },
                { kind: "Field", name: { kind: "Name", value: "difficulty" } },
                { kind: "Field", name: { kind: "Name", value: "lengthKm" } },
                { kind: "Field", name: { kind: "Name", value: "bodyHtml" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "notices" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                      { kind: "Field", name: { kind: "Name", value: "level" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "status" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "guideSlug" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "body" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "runs" },
                              selectionSet: {
                                kind: "SelectionSet",
                                selections: [
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "text" },
                                  },
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "bold" },
                                  },
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "italic" },
                                  },
                                  {
                                    kind: "Field",
                                    name: { kind: "Name", value: "href" },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GuideDetailsQuery, GuideDetailsQueryVariables>;
export const GuidesPageDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "GuidesPage" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "preview" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "Boolean" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "guides" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
                { kind: "Field", name: { kind: "Name", value: "title" } },
                { kind: "Field", name: { kind: "Name", value: "region" } },
                { kind: "Field", name: { kind: "Name", value: "difficulty" } },
                { kind: "Field", name: { kind: "Name", value: "lengthKm" } },
                { kind: "Field", name: { kind: "Name", value: "bodyHtml" } },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "notices" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "preview" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "preview" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "title" } },
                { kind: "Field", name: { kind: "Name", value: "level" } },
                { kind: "Field", name: { kind: "Name", value: "status" } },
                { kind: "Field", name: { kind: "Name", value: "guideSlug" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "body" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "runs" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "text" },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "bold" },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "italic" },
                            },
                            {
                              kind: "Field",
                              name: { kind: "Name", value: "href" },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GuidesPageQuery, GuidesPageQueryVariables>;
export const MinaTurerDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "MinaTurer" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "tours" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "limit" },
                value: { kind: "IntValue", value: "200" },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "title" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "user" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MinaTurerQuery, MinaTurerQueryVariables>;
export const TourDetailsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "TourDetails" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "tour" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "title" } },
                { kind: "Field", name: { kind: "Name", value: "distanceM" } },
                { kind: "Field", name: { kind: "Name", value: "notes" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "logs" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "recordedAt" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "elevationM" },
                      },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "heartRate" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<TourDetailsQuery, TourDetailsQueryVariables>;
export const TurerDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "Turer" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "tours" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "limit" },
                value: { kind: "IntValue", value: "50" },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "title" } },
                { kind: "Field", name: { kind: "Name", value: "distanceM" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "user" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "displayName" },
                      },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "guide" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "title" } },
                    ],
                  },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "photos" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<TurerQuery, TurerQueryVariables>;
