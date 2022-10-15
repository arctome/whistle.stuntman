module.exports = async (server, options) => {
  server.on('request', async (req, res) => {
    await Promise.all([options.STUNTMAN_OPTIONS.mock.read(), options.STUNTMAN_OPTIONS.config.read()])
    const queryKey = options.STUNTMAN_OPTIONS.config.data.query_key
    const urlObj = new URL(req.fullUrl)
    if(urlObj.searchParams.get(queryKey)) {
      let mockId = urlObj.searchParams.get(queryKey)
      let mockedRes = options.STUNTMAN_OPTIONS.mock.data.mocks
      let exist = mockedRes.find(mock => mock.mock_id === mockId)
      if(!exist) {
        req.passThrough()
        return;
      }
      if(!exist.current_con) {
        req.passThrough()
        return;
      }
      let currentCondition = exist.cons.find(con => con.con_id === exist.current_con)
      if(!currentCondition) {
        console.error(`request condition (${exist.current_con}) is not exist anymore, please change it.`)
        req.passThrough()
        return;
      }
      const out = {
        statusCode: currentCondition.res_status,
        headers: currentCondition.res_headers ? JSON.parse(currentCondition.res_headers) : {},
        body: currentCondition.res_body
      }
      res.writeHead(out.statusCode, out.headers);
      res.end(out.body);
      console.log(`[stuntman] mocked: ${req.fullUrl} 
                   => (local mock data, ID: ${mockId}, Condition: ${exist.current_con})`)
    } else {
      req.passThrough()
    }
  });

  // handle websocket request
  server.on('upgrade', (req, socket) => {
    // do something
    req.passThrough();
  });

  // handle tunnel request
  server.on('connect', (req, socket) => {
    // do something
    req.passThrough();
  });
};
