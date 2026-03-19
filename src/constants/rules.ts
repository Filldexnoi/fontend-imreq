export interface Rule {
  section: string
  name: string
  description: string
}

export const RULES: Rule[] = [
  { section: '5.2.4', name: "Modal Verb 'Should'",     description: "Use 'should' to denote a non-mandatory goal, preference, or recommended practice." },
  { section: '5.2.4', name: 'Active Voice',             description: "Use active voice to clearly identify the subject (e.g., 'The system shall...' instead of 'It is required that...')." },
  { section: '5.2.7', name: 'Subjective Language',      description: "Avoid terms like 'user-friendly', 'easy to use', 'robust', or 'reliable' without quantitative criteria." },
  { section: '5.2.7', name: 'Open-ended Terms',         description: "Avoid using 'etc.', 'and so on', or 'and/or' which lead to uncertainty in scope." },
  { section: '5.2.4', name: 'System Performance',       description: "Requirements should define the performance of the system, not a capability of the user or operator." },
  { section: '5.2.7', name: 'Vague Pronouns',           description: "Avoid using 'it', 'this', 'that', or 'they' to refer to subjects; always restate the subject for clarity." },
  { section: '5.2.4', name: "Avoid 'Must'",             description: "Avoid using the term 'must' to prevent potential misinterpretation; use 'shall' for binding requirements." },
  { section: '5.2.4', name: 'Positive Phrasing',        description: "Requirements should be stated as positive statements (what the system shall do) rather than negative (shall not)." },
  { section: '5.2.4', name: 'Measurable Conditions',    description: 'A well-formed requirement is qualified by measurable conditions that define its boundaries.' },
  { section: '5.2.7', name: 'Superlatives',             description: "Avoid superlatives like 'best', 'fastest', or 'most efficient' unless they are verifiable constraints." },
  { section: '5.2.7', name: 'Comparative Phrases',      description: "Avoid phrases like 'better than' or 'superior' because they cannot be verified without a defined baseline." },
  { section: '5.2.7', name: 'Loopholes',                description: "Avoid phrases like 'if possible', 'as appropriate', 'as applicable', or 'including but not limited to'." },
  { section: '5.2.4', name: "Avoid 'Shall be able to'", description: "Avoid using 'shall be able to' or 'shall be capable of'; state the action directly (e.g., 'The system shall [Action]')." },
  { section: '5.2.4', name: 'Formal Syntax',            description: 'A well-formed requirement should follow the structure: [Condition] [Subject] [Action] [Object] [Constraint].' },
  { section: '5.2.4', name: "Modal Verb 'Shall'",       description: "Use 'shall' to denote a binding, mandatory requirement that is contractually required." },
  { section: '5.2.7', name: 'Design Independence',      description: "Requirements should state 'what' is needed, not 'how'. Do not include design decisions or commercial products." },
  { section: '5.2.7', name: 'Ambiguous Adjectives',     description: "Avoid vague adjectives like 'adequate', 'significant', 'sufficient', 'flexible', or 'minimal'." },
]

export const RULES_MAP: Record<string, Rule> = Object.fromEntries(RULES.map(r => [r.name, r]))
