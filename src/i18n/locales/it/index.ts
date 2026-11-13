// The Italian messages - the source the other languages are checked
// against (see ../index.ts) - one file per area of the app.
import app from './app'
import editing from './editing'
import history from './history'
import store from './store'
import tools from './tools'
import viewer from './viewer'

const it = { app, store, viewer, editing, tools, history }
export default it
export type Messages = typeof it
