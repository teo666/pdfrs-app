// The Spanish messages, checked against the Italian ones (see ../it).
import type { Messages } from '../it'
import app from './app'
import editing from './editing'
import history from './history'
import store from './store'
import tools from './tools'
import viewer from './viewer'

const es = { app, store, viewer, editing, tools, history } satisfies Messages
export default es
