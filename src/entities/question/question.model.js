const questionSchema = require('./question.schema')
const dbLoader = require('../../utils/dbLoader')

module.exports = () => {
  const Question = dbLoader.getDB().model('question', questionSchema, 'question')

  return Object.freeze({
    get: async (find, limit, offset, sort) => {
      try {
        const questions = await Question.find(find).limit(limit).skip(offset).sort(sort)
        if (questions.length === 0) throw new Error('No Question found.')
        return questions
      } catch (e) {
        throw e
      }
    },
    insert: async (object) => {
    },
    update: async (where, data) => {
    },
    delete: async (where) => {
    },
  })
}
