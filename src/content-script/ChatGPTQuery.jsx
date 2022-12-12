import { useEffect, useState } from 'preact/hooks'
import PropTypes from 'prop-types'
import { MarkdownRender } from './markdown.jsx'
import Browser from 'webextension-polyfill'

function ChatGPTQuery(props) {
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const port = Browser.runtime.connect()
    const listener = (msg) => {
      if (msg.answer) {
        setAnswer('**ChatGPT:**\n\n' + msg.answer)
      } else if (msg.error === 'UNAUTHORIZED') {
        setError('UNAUTHORIZED')
      } else {
        setError('EXCEPTION')
      }
    }
    port.onMessage.addListener(listener)
    port.postMessage({ question: props.question })
    return () => {
      port.onMessage.removeListener(listener)
      port.disconnect()
    }
  }, [props.question])

  if (answer) {
    return (
      <div id="answer" className="markdown-body gpt-inner" dir="auto">
        <MarkdownRender>{answer}</MarkdownRender>
      </div>
    )
  }

  if (error === 'UNAUTHORIZED') {
    return (
      <p className="gpt-inner">
        Please login at{' '}
        <a href="https://chat.openai.com" target="_blank" rel="noreferrer">
          chat.openai.com
        </a>{' '}
        first
      </p>
    )
  }
  if (error) {
    return <p className="gpt-inner">Failed to load response from ChatGPT</p>
  }

  return <p className="gpt-loading gpt-inner">Waiting for ChatGPT response...</p>
}

ChatGPTQuery.propTypes = {
  question: PropTypes.string.isRequired,
}

export default ChatGPTQuery
