// The French messages - one file per area of the app, checked against the
// Italian ones (see ../it).
import type { Messages } from '../it'

import app from './app'
import editing from './editing'
import history from './history'
import store from './store'
import tools from './tools'
import viewer from './viewer'

const fr = { app, store, viewer, editing, tools, history } satisfies Messages
export default fr
