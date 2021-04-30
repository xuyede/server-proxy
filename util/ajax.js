/**
 * ajax请求,回调遵循 ErrorFirst定义
 */

/*
  ajax({
    method: 'post',
    url: '',
    data: {}
  }, (err, ret) => {
    // err为一个错误信息对象 { code, msg }
    // ret为成功处理结果
  })
*/

const defaultOpt = {
  method: 'post',
  url: '',
  data: {},
  timeout: 60000,
  requestHeader: 'application/x-www-form-urlencoded',
  flag: true
}

function ajax(opt, callback) {
  const option = Object.assign({}, defaultOpt, opt);
  let xhr = null;
  if (window.XMLHttpRequest) {
    xhr = new XMLHttpRequest(); 
  } else {
    xhr = new ActiveXObject('Microsoft.XMLHttp');
  }

  xhr.onreadystatechange = () => {
    // 请求超时定时器
    const xhrTimer = setTimeout(() => {
      if (xhr.readyState !== 4) {
        callback({ code: 405 }, null)
        xhr.abort();
      }
    }, option.timeout);

    if (xhr.readyState === 4) {
      clearTimeout(xhrTimer);
      if (xhr.status === 200) {
        let result = null;
        try {
          result = JSON.parse(xhr.responseText);
          callback.call(xhr, null, result)
        } catch (e) {
          callback({ code: xhr.status, msg: e.message }, null)
        }
      } else {
        callback.call(xhr, { code: xhr.status, msg: xhr.responseText }, null)
      }
    }
  }

  let method = option.method.toUpperCase()
  if (method === 'POST') {
    xhr.open(method, option.url, option.flag)
    xhr.setRequestHeader('Content-Type', option.requestHeader);
    xhr.send(JSON.stringify(option.data))
  } else if (method === 'GET') {
    let date = new Date(),
        time = date.getTime();
    xhr.open(method, option.url + '?' + JSON.stringify(option.data) + '&time=' + time, option.flag);
    xhr.send();
  }
}