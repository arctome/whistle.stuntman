const initDataDir = require('../../../utils/tools').initDataDir
const homeDirPath = require('../../../utils/tools').homeDirPath

module.exports = {
    __defaultConfig: {
        // first_match: "query_key", // use query key by default, alter value is "url"
        run_mode: "", // ""-disable, "global"-match all, "pac"-respect `rules.txt` matching rule
        rules_content: "",
        autosave_response: false, // bool, data will be saved to "$HOMEDIR/.StuntmanAppData/saved/{domain+path}/{timestamp}.json"
        query_key: "ajaxID"
    },
    __defaultMock: {
        mocks: [
            // {
            //     "mock_id": "12354",
            //     "url": "",
            //     "title": "",
            //     "desc": "",
            //     "category": "",
            //     "update_at": 0, // Date.now()
            //     "cons": [
            //         {
            //             "con_id": "abcd",
            //             "con_name": "This is a test name",
            //             "res_type": "",
            //             "res_body": "",
            //             "res_header": JSON.stringify({
            //                 "Content-Type": "application/json"
            //             }),
            //             "res_status": 200
            //         }
            //     ]
            // }
        ]
    },
    loadDeps: async function () {
        const loadLowdb = async () => {
            return await import('lowdb')
            // return { Low, JSONFile }
        }
        const LOWDB = await loadLowdb()
        const loadNanoid = async () => {
            const { nanoid } = await import('nanoid')
            return nanoid
        }
        const nanoid = await loadNanoid()
        return {
            LOWDB,
            nanoid
        }
    },
    setup: function (options) {
        initDataDir();
        let STUNTMAN_OPTIONS = {}
        const TextFile = options.DEPS.LOWDB.TextFile
        class JSONMinifiedFile {
            constructor(filename) {
                this.adapter = new TextFile(filename)
            }

            async read() {
                const data = await this.adapter.read()
                if (data === null) {
                    return null
                } else {
                    return JSON.parse(data)
                }
            }

            write(obj) {
                return this.adapter.write(JSON.stringify(obj))
            }
        }
        const mockDB = new options.DEPS.LOWDB.Low(new JSONMinifiedFile(homeDirPath()))
        const configDB = new options.DEPS.LOWDB.Low(new JSONMinifiedFile(homeDirPath('config')))
        STUNTMAN_OPTIONS = {
            config: configDB,
            mock: mockDB
        }
        return STUNTMAN_OPTIONS;
    },
    updateConfig: async function (options, new_config) {
        if (!options.STUNTMAN_OPTIONS || !options.STUNTMAN_OPTIONS.config) return;
        await options.STUNTMAN_OPTIONS.config.read()
        new_config = Object.assign({}, this.__defaultConfig, new_config)
        options.STUNTMAN_OPTIONS.config.data = new_config
        await options.STUNTMAN_OPTIONS.config.write()
        return true
    },
    loadConfig: async function (options) {
        if (!options.STUNTMAN_OPTIONS || !options.STUNTMAN_OPTIONS.config) return;
        await options.STUNTMAN_OPTIONS.config.read()
        return options.STUNTMAN_OPTIONS.config.data || this.__defaultConfig;
    },
    create: async function (options, data) {
        if (!options.STUNTMAN_OPTIONS || !options.STUNTMAN_OPTIONS.mock) return;
        await options.STUNTMAN_OPTIONS.mock.read()
        if (!options.STUNTMAN_OPTIONS.mock.data) options.STUNTMAN_OPTIONS.mock.data = this.__defaultMock
        // FIXME: add a layer for validation
        options.STUNTMAN_OPTIONS.mock.data.mocks.unshift({
            ...data,
            mock_id: options.DEPS.nanoid(8),
            update_at: Date.now(),
            current_con: data.current_con || ''
        })
        await options.STUNTMAN_OPTIONS.mock.write()
        return true
    },
    update: async function (options, data) {
        if (!options.STUNTMAN_OPTIONS || !options.STUNTMAN_OPTIONS.mock) return;
        await options.STUNTMAN_OPTIONS.mock.read()
        if (!options.STUNTMAN_OPTIONS.mock.data) return false;
        // FIXME: Integrity compromised, should consider a repairment
        if (!Array.isArray(options.STUNTMAN_OPTIONS.mock.data.mocks)) return false;
        let mock_id_index = options.STUNTMAN_OPTIONS.mock.data.mocks.findIndex(mock => mock.mock_id === data.mock_id)
        if (mock_id_index < 0) return false;
        // FIXME: add a layer for validation
        options.STUNTMAN_OPTIONS.mock.data.mocks[mock_id_index] = {
            ...options.STUNTMAN_OPTIONS.mock.data.mocks[mock_id_index],
            ...data,
            update_at: Date.now()
        }
        await options.STUNTMAN_OPTIONS.mock.write()
        return true;
    },
    delete: async function (options, mock_id) {
        if (!options.STUNTMAN_OPTIONS || !options.STUNTMAN_OPTIONS.mock) return;
        await options.STUNTMAN_OPTIONS.mock.read()
        if (!options.STUNTMAN_OPTIONS.mock.data) return false;
        // FIXME: Integrity compromised, should consider a repairment
        if (!Array.isArray(options.STUNTMAN_OPTIONS.mock.data.mocks)) return false;
        let mock_id_index = options.STUNTMAN_OPTIONS.mock.data.mocks.findIndex(mock => mock.mock_id === mock_id)
        if (mock_id_index < 0) return false;
        // FIXME: add a layer for validation
        options.STUNTMAN_OPTIONS.mock.data.mocks.splice(mock_id_index, 1)
        await options.STUNTMAN_OPTIONS.mock.write()
        return true;
    },
    list: async function (options, page, size, category = "") {
        if (!options.STUNTMAN_OPTIONS || !options.STUNTMAN_OPTIONS.mock) return;
        await options.STUNTMAN_OPTIONS.mock.read()
        if (!options.STUNTMAN_OPTIONS.mock.data) return [];
        // FIXME: Integrity compromised, should consider a repairment
        if (!Array.isArray(options.STUNTMAN_OPTIONS.mock.data.mocks)) return false;
        if (!page) page = 1
        if (!size) size = 10
        if ((page - 1) * size >= options.STUNTMAN_OPTIONS.mock.data.mocks.length) return false;
        let untruncated = options.STUNTMAN_OPTIONS.mock.data.mocks.filter(mock => {
            if (!category) return true;
            return mock.category.split(",").includes(category)
        })
        const total = untruncated.length;
        let truncated = untruncated.splice((page - 1) * size, size)
        return { truncated, total }
    },
    findById: async function (options, mock_id) {
        if (!options.STUNTMAN_OPTIONS || !options.STUNTMAN_OPTIONS.mock) return;
        await options.STUNTMAN_OPTIONS.mock.read()
        if (!options.STUNTMAN_OPTIONS.mock.data) return false;
        // FIXME: Integrity compromised, should consider a repairment
        if (!Array.isArray(options.STUNTMAN_OPTIONS.mock.data.mocks)) return false;
        let mock_id_index = options.STUNTMAN_OPTIONS.mock.data.mocks.findIndex(mock => mock.mock_id === mock_id)
        if (mock_id_index < 0) return false;
        return options.STUNTMAN_OPTIONS.mock.data.mocks[mock_id_index]
    },
    findByUrl: async function (options, host, path) {
        if (!options.STUNTMAN_OPTIONS || !options.STUNTMAN_OPTIONS.mock) return;
        await options.STUNTMAN_OPTIONS.mock.read()
        if (!options.STUNTMAN_OPTIONS.mock.data) return false;
        // FIXME: Integrity compromised, should consider a repairment
        if (!Array.isArray(options.STUNTMAN_OPTIONS.mock.data.mocks)) return false;
        let mock_id_index = options.STUNTMAN_OPTIONS.mock.data.mocks.findIndex(mock => mock.host === host && mock.path === path)
        if (mock_id_index < 0) return false;
        return options.STUNTMAN_OPTIONS.mock.data.mocks[mock_id_index]
    },
    listEnabled: async function (options) {
        if (!options.STUNTMAN_OPTIONS || !options.STUNTMAN_OPTIONS.mock) return;
        await options.STUNTMAN_OPTIONS.mock.read()
        if (!options.STUNTMAN_OPTIONS.mock.data) return [];
        let truncated = options.STUNTMAN_OPTIONS.mock.data.mocks.filter(mock => Boolean(mock.current_con) === true)
        return truncated
    }
}