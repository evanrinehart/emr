var HTML;
(function(){
  function jstype(x){
    var raw = ({}).toString.call(x)
    var results = raw.match(/\[object (\w+)\]/)
    if(results){
      return results[1];
    }
    else {
      throw new Error("unknown jstype ("+raw+")");
    };
  }

  function encodeDate(d){
    function pad(x){
      if(x.length < 2) return '0'+x;
      else return x;
    }

    return [
      d.getFullYear(),
      pad((d.getMonth()+1).toString()),
      pad(d.getDate().toString())
    ].join('-');
  }

  function htmlEncode(s){
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function attrs(obj){
    var a = [];
    var v;
    for(var k in obj){
      switch(jstype(obj[k])){
        case 'String': v = obj[k]; break;
        case 'Number':
        case 'Date':
          v = obj[k].toString(); break;
        case 'Undefined':
          console.error("undefined attribute in ", obj);
          continue;
        default:
          console.log(obj[k]);
          throw new Error('bad attr');
      }
      a.push(k);
      a.push('="');
      a.push(htmlEncode(v));
      a.push('" ');
    }
    return a;
  }

  function toArray(xs){
    var a = [];
    var i, L;
    L = xs.length;
    for(i=0; i<L; i++){
      a.push(xs[i]);
    }
    return a;
  }

  function tags(tag, args){
    if(jstype(args[0]) == 'Object'){
      var attData = args[0];
      var rest = toArray(args).slice(1);
      return ['<',tag,' ', attrs(attData),'>',rest,'</',tag,'>'];
    }
    else{
      return ['<',tag,'>',toArray(args),'</',tag,'>'];
    }
  }

  function tag(tag, attData){
    return ['<',tag,' ', attrs(attData),'>'];
  }

  function div(){ return tags('div', arguments); }
  function span(){ return tags('span', arguments); }
  function p(){ return tags('p', arguments); }
  function a(){ return tags('a', arguments); }
  function i(){ return tags('i', arguments); }
  function b(){ return tags('b', arguments); }
  function ul(){ return tags('ul', arguments); }
  function li(){ return tags('li', arguments); }
  function table(){ return tags('table', arguments); }
  function tr(){ return tags('tr', arguments); }
  function th(){ return tags('th', arguments); }
  function td(){ return tags('td', arguments); }
  function textarea(){ return tags('textarea', arguments); }
  function button(){ return tags('button', arguments); }
  function h1(){ return tags('h1', arguments); }
  function h2(){ return tags('h2', arguments); }
  function h3(){ return tags('h3', arguments); }
  function h4(){ return tags('h4', arguments); }
  function select(){ return tags('select', arguments); }
  function option(){ return tags('option', arguments); }
  function label(){ return tags('label', arguments); }
  function form(){ return tags('form', arguments); }
  function input(as){ return tag('input', as); }
  function br(as){ return tag('br', as); }
  function hr(as){ return tag('hr', as); }
  function img(as){ return tag('img', as); }

  function selectWithConfig(config){
    var placeholder = config.placeholder;
    var selected = config.selected;
    var options = config.options;
    var attributes = config.attributes;
    return select(attributes, [
      placeholder ? option(placeholder) : '',
      options.map(function(opt){
        if(opt.value == selected){
          return option({value: opt.value, selected: 'selected'}, opt.label);
        }
        else{
          return option({value: opt.value}, opt.label);
        }
      })
    ]);
  }

  function flatten(tree){
    function flattenR(tree, a){
      switch(jstype(tree)){
        case 'String': a.push(tree); break;
        case 'Number': a.push(tree.toString()); break;
        case 'Array':
        case 'Arguments':
          var i;
          var L = tree.length;
          for(i=0; i<L; i++){ flattenR(tree[i], a); }
          break;
        case 'Undefined': a.push('undefined'); break;
        case 'Null': a.push('null'); break;
        case 'Date': a.push(encodeDate(tree)); break;
        default:
          console.log(tree);
          throw new Error("bad tree");
      }
      return a;
    }
    return flattenR(tree, []);
  }

  function buildElement(tree){
    var html = flatten(tree).join('');
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.firstChild;
  }

  HTML = {
    encode: htmlEncode,
    element: buildElement,
    div: div,
    span: span,
    p: p,
    a: a,
    i: i,
    b: b,
    ul: ul,
    li: li,
    table: table,
    tr: tr,
    th: th,
    td: td,
    textarea: textarea,
    button: button,
    h1: h1,
    h2: h2,
    h3: h3,
    h4: h4,
    label: label,
    input: input,
    br: br,
    hr: hr,
    img: img,
    select: select,
    option: option,
    form: form,
    selectWithConfig: selectWithConfig,
  };
})();
