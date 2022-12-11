import './styles.css'
import './katex.less'
import 'github-markdown-css'

import Browser from 'webextension-polyfill'
import { getMarkdownRenderer } from './markdown.mjs'
import { config } from './search-engine-configs.mjs'
import { getPossibleElementByQuerySelector } from './utils.mjs'

export async function run(question, siteConfig) {
  const markdown = getMarkdownRenderer()

  const container = document.createElement('div')
  container.className = 'chat-gpt-container'
  container.innerHTML = '<p class="gpt-loading">Waiting for ChatGPT response...</p>'

  const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      appendContainer.appendChild(container)
    }
  }

  const port = Browser.runtime.connect()
  port.onMessage.addListener(function (msg) {
    if (msg.answer) {
      container.innerHTML = '<div id="answer" class="markdown-body" dir="auto"></div>'
      container.querySelector('#answer').innerHTML = markdown.render(
        '**ChatGPT:**\n\n' + msg.answer,
      )
    } else if (msg.error === 'UNAUTHORIZED') {
      container.innerHTML =
        '<p>Please login at <a href="https://chat.openai.com" target="_blank">chat.openai.com</a> first</p>'
    } else {
      container.innerHTML = '<p>Failed to load response from ChatGPT</p>'
    }
  })
  port.postMessage({ question })
}

export function getSearchInputValue(siteConfig) {
  const searchInput = getPossibleElementByQuerySelector(siteConfig.inputQuery)
  if (searchInput && searchInput.value) {
    // only run on first page
    const startParam = new URL(location.href).searchParams.get('start') || '0'
    if (startParam === '0') {
      return searchInput.value
    }
  }
}

const siteRegex = new RegExp(Object.keys(config).join('|'))
const siteName = location.hostname.match(siteRegex)[0]
const siteAction = config[siteName].action
if (siteAction && siteAction.init) {
  siteAction.init()
}
const searchValue = getSearchInputValue(config[siteName])
if (searchValue) {
  run(searchValue, config[siteName])
}
