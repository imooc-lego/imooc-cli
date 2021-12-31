const  ADD_PAGES = 'page'
const ADD_CODE = 'code'
const DEFAULT_TYPE = ADD_PAGES
// 添加的类型
const ADD_CONTENT = [{
    name: '页面',
    value: ADD_PAGES,
  }, {
    name: '代码片段',
    value: ADD_CODE,
}]
const ADD_PAGES_TEMPLATE = [
  {
    name: 'Vue2 文件模版',
    npmName: 'add-demo-template',
    version: '1.0.0',
    // template:'template/src/views/type' // 这里指定安装的页面之后外面的image等相关静态文件无法添加
    template:'template/src',
    pageName: 'type',
    ignore: ['main']
  },
  {
    name: 'Vue3 文件模版',
    npmName: 'add-demo2-template',
    version: '1.0.0',
  },
]
const DEFAULT_CLI_HOME = '.imooc-cli'

module.exports = {
  ADD_CONTENT,
  DEFAULT_TYPE,
  ADD_PAGES_TEMPLATE,
  DEFAULT_CLI_HOME
}