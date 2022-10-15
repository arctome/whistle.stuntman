const Stuntman = require('./model/stuntman')

// For help see https://github.com/ZijianHe/koa-router#api-reference
module.exports = async (router, options) => {
  const { LOWDB, nanoid } = await Stuntman.loadDeps();
  options.DEPS = {
    LOWDB,
    nanoid
  }
  const STUNTMAN_OPTIONS = Stuntman.setup(options)
  options.STUNTMAN_OPTIONS = STUNTMAN_OPTIONS
  /**
   * @route /management/whistle-rules 提供给whistle的匹配规则，分全局、部分域名(类pac)和关闭模式
   */
  router.get('/management/whistle-rules', async ctx => {
    let config = await Stuntman.loadConfig(options)
    // 全局
    if (config.run_mode === "global") {
      ctx.body = `* stuntman://`
      // PAC
    } else if (config.run_mode === "pac") {
      ctx.body = `stuntman:// ${config.rules_content}`
      // 未开启
    } else {
      ctx.body = ""
    }
    ctx.status = 200
    return;
  })

  router.get('/management/config', async ctx => {
    let config = await Stuntman.loadConfig(options)
    ctx.body = JSON.stringify({
      ok: 1,
      data: config
    })
  })
  router.post('/management/config', async ctx => {
    let new_config = ctx.request.body
    let result = await Stuntman.updateConfig(options, new_config)
    if (!result) {
      ctx.body = JSON.stringify({
        ok: 0
      })
      ctx.status = 400
      return;
    }
    ctx.body = JSON.stringify({
      ok: 1
    })
  })

  /**
   * @query page (default 1)
   * @query size (default 10)
   * @query c (category, encodedURIComponent)
   */
  router.get('/mocks/list', async ctx => {
    let response = await Stuntman.list(options,
      (ctx.request.query.page ? parseInt(ctx.request.query.page) : 1),
      (ctx.request.query.size ? parseInt(ctx.request.query.size) : 10),
      (ctx.request.query.c ? decodeURIComponent(ctx.request.query.c) : "")
    )
    if (!response) {
      ctx.status = 400
      ctx.body = JSON.stringify({
        ok: 0
      })
      return
    }
    ctx.body = JSON.stringify({
      ok: 1,
      data: response.truncated,
      total: response.total
    })
  })
  router.get('/mocks/list-enabled', async ctx => {
    let truncated = await Stuntman.listEnabled(options)
    if (!truncated) {
      ctx.status = 400
      ctx.body = JSON.stringify({
        ok: 0
      })
      return
    }
    ctx.body = JSON.stringify({
      ok: 1,
      data: truncated
    })
  })

  router.get('/mocks/item', async ctx => {
    if (!ctx.request.query.id) {
      ctx.body = JSON.stringify({
        ok: 0,
        msg: "Mock ID is missing"
      })
      ctx.status = 400
      return;
    }
    let data = await Stuntman.findById(options, ctx.request.query.id)
    if (!data) {
      ctx.body = JSON.stringify({
        ok: 0,
        msg: "Requested mock ID is not found"
      })
      ctx.status = 404
      return;
    }
    ctx.body = JSON.stringify({
      ok: 1,
      data
    })
  })

  router.post('/mocks/item', async ctx => {
    let new_mock = ctx.request.body
    if (!new_mock) {
      ctx.body = JSON.stringify({
        ok: 0,
        msg: "No data"
      })
      ctx.status = 400
      return;
    }
    if (new_mock.mock_id) {
      let result = await Stuntman.update(options, new_mock)
      if (!result) {
        ctx.body = JSON.stringify({
          ok: 0
        })
        ctx.status = 400
        return;
      }
      ctx.body = JSON.stringify({
        ok: 1
      })
    } else {
      await Stuntman.create(options, new_mock)
      ctx.body = JSON.stringify({
        ok: 1
      })
    }
  })

  router.delete('/mocks/item', async ctx => {
    let mock_id = ctx.request.query.id
    if (!mock_id) {
      ctx.body = JSON.stringify({
        ok: 0,
        msg: "No mock id"
      })
      ctx.status = 400
      return
    }
    let result = await Stuntman.delete(options, mock_id)
    if (!result) {
      ctx.body = JSON.stringify({
        ok: 0,
        msg: "failed to delete"
      })
      ctx.status = 400
      return;
    }
    ctx.body = JSON.stringify({
      ok: 1
    })
  })

  router.post('/mocks/con', async ctx => {
    var data = ctx.request.body
    let oldData = await Stuntman.findById(options, data.mock_id)
    if (!oldData) {
      ctx.body = JSON.stringify({
        ok: 0
      })
      ctx.status = 400
      return;
    }
    if (!data.con.con_id) {
      data.con.con_id = nanoid(4)
      oldData.cons.push(data.con)
    } else {
      let idx = oldData.cons.findIndex(con => con.con_id === data.con.con_id)
      if (idx < 0) {
        ctx.body = JSON.stringify({
          ok: 0
        })
        ctx.status = 400
        return;
      }
      oldData.cons[idx] = data.con
    }

    let result = await Stuntman.update(options, oldData)
    if (!result) {
      ctx.body = JSON.stringify({
        ok: 0
      })
      ctx.status = 400
      return;
    }
    ctx.body = JSON.stringify({
      ok: 1
    })
  })
  router.delete('/mocks/con', async ctx => {
    let mock_id = ctx.request.query.mock_id
    let con_id = ctx.request.query.con_id
    if (!mock_id || !con_id) {
      ctx.body = JSON.stringify({
        ok: 0
      })
      ctx.status = 400
      return;
    }
    let oldData = await Stuntman.findById(options, data.mock_id)
    if (!oldData) {
      ctx.body = JSON.stringify({
        ok: 0
      })
      ctx.status = 400
      return;
    }
    let idx = oldData.cons.findIndex(con => con.con_id === con_id)
    if (idx < 0) {
      ctx.body = JSON.stringify({
        ok: 0
      })
      ctx.status = 400
      return;
    }
    oldData.cons.splice(idx, 1)
    if (oldData.current_con === con_id) oldData.current_con = "";

    let result = await Stuntman.update(options, oldData)
    if (!result) {
      ctx.body = JSON.stringify({
        ok: 0
      })
      ctx.status = 400
      return;
    }
    ctx.body = JSON.stringify({
      ok: 1
    })
  })
};
