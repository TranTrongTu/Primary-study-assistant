import { describe, expect, it } from 'vitest'
import {
  computeScoreFromQuestions,
  mergeExerciseItem,
  transformExerciseItem,
  transformStudyActivityDetail,
  transformStudyActivitySummary,
} from './quizHelpers'

const apiItem = (overrides = {}) => ({
  id: 1,
  question: 'Một nửa của 10 là bao nhiêu?',
  max_score: 33.333,
  user_score: null,
  attempt: null,
  explanation: null,
  contents: [
    { id: 11, content: '5', is_correct: true },
    { id: 12, content: '2' },
  ],
  ...overrides,
})

describe('transformExerciseItem', () => {
  it('maps the API fields and rounds scores to two decimals', () => {
    const question = transformExerciseItem(apiItem({ user_score: 16.6666 }))

    expect(question).toMatchObject({
      id: 1,
      text: 'Một nửa của 10 là bao nhiêu?',
      maxScore: 33.33,
      userScore: 16.67,
      attemptId: null,
    })
    expect(question.options).toEqual([
      { id: 11, content: '5', isCorrect: true },
      { id: 12, content: '2', isCorrect: null },
    ])
  })

  it('reads a numeric attempt as a number and keeps a text answer as text', () => {
    expect(transformExerciseItem(apiItem({ attempt: '12' })).attemptId).toBe(12)
    expect(transformExerciseItem(apiItem({ attempt: 'năm' })).attemptId).toBe('năm')
  })

  it('accepts an item without answer options', () => {
    expect(transformExerciseItem(apiItem({ contents: undefined })).options).toEqual([])
  })
})

describe('computeScoreFromQuestions', () => {
  it('adds up scores and counts a question as correct only at full marks', () => {
    const score = computeScoreFromQuestions([
      { maxScore: 50, userScore: 50 },
      { maxScore: 25, userScore: 10 },
      { maxScore: 25, userScore: null },
    ])

    expect(score).toEqual({
      totalScore: 60,
      totalMaxScore: 100,
      percent: 60,
      correct: 1,
      total: 3,
    })
  })

  it('reports 0 percent instead of dividing by zero', () => {
    expect(computeScoreFromQuestions([]).percent).toBe(0)
  })
})

describe('transformStudyActivityDetail', () => {
  const activity = (overrides = {}) => ({
    id: 7,
    name: '',
    subject_type: 'MATHS',
    is_submitted: false,
    items: [
      apiItem({ id: 30, max_score: 50, user_score: 50 }),
      apiItem({ id: 4, max_score: 50, user_score: 0 }),
    ],
    ...overrides,
  })

  it('orders questions by id so they do not jump around between reloads', () => {
    const quiz = transformStudyActivityDetail(activity())

    expect(quiz.questions.map((question) => question.id)).toEqual([4, 30])
    expect(quiz.hasDetails).toBe(true)
  })

  it('shows no score before the quiz is submitted', () => {
    expect(transformStudyActivityDetail(activity()).score).toBeNull()
  })

  it('computes the score from the questions once the quiz is submitted', () => {
    const quiz = transformStudyActivityDetail(activity({ is_submitted: true }))

    expect(quiz.score).toMatchObject({ totalScore: 50, totalMaxScore: 100, percent: 50, correct: 1 })
  })

  it('prefers a score sent by the backend over the computed one', () => {
    const quiz = transformStudyActivityDetail(
      activity({ is_submitted: true, score: { total_score: 80, total_max_score: 100 } }),
    )

    expect(quiz.score.totalScore).toBe(80)
  })
})

describe('transformStudyActivitySummary', () => {
  it('falls back to a title built from the subject when the quiz has no name', () => {
    const summary = transformStudyActivitySummary({ id: 1, name: '', subject_type: 'MATHS' })

    expect(summary.title).toBe('Quiz Toán')
    expect(summary.questions).toEqual([])
  })
})

describe('mergeExerciseItem', () => {
  it('replaces only the updated question and does not mutate the quiz', () => {
    const quiz = { id: 1, questions: [{ id: 1, attemptId: null }, { id: 2, attemptId: null }] }

    const updated = mergeExerciseItem(quiz, { id: 2, attemptId: 22 })

    expect(updated.questions).toEqual([{ id: 1, attemptId: null }, { id: 2, attemptId: 22 }])
    expect(quiz.questions[1].attemptId).toBeNull()
  })

  it('returns null when there is no quiz yet', () => {
    expect(mergeExerciseItem(null, { id: 1 })).toBeNull()
  })
})
