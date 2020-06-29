const api = "https://api.douban.com/v2/book/search";
const apikey = "0df993c66c0c636e29ecbb5344252a4a";
let url;

let books = [];
let readbooks = 0;

function GetBooksRank(query) {
    books = [];
    url = `${api}?apikey=${apikey}&q=${encodeURI(query)}`;

    var progress = document.getElementById("searching-progress");
    progress.hidden = false;
    progress.value = `0`;

    var ul = document.getElementById("search-result-list");
    while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    jsonp(url)
}

/**
 * 解决的就是跨域访问的问题
 * 访问某个 url，服务器返回的 JSON 会传递给一个名叫 callback 的全局函数
 * @param url
 */
function jsonp(url) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url + "&callback=callback";
    script.async = true;
    document.body.append(script)
}

/**
 * 豆瓣的搜索 API 是这样的：
 * https://api.douban.com/v2/book/search?q=[q]&start=[start]
 * 其中 q 是需要搜索的文本
 * start 为每页数据的书籍条目的起始下标。如果不传入 start 参数，则该 API 返回第一页数据。
 * 每页数据都有字段 count，表示该页的书籍条目数量，
 * 字段 start 表示该页书籍条目的起始下标，
 * 字段 total 表示书籍条目总数。
 * @param page
 */
function callback(page) {
    const count = page['count'];
    const start = page['start'];
    let total = page['total'];

    if (total > 2048) {
        total = 2048;
    }

    console.log(`total books: ${total}; current index: ${start}`);

    if (total == 0) {
        return;
    }

    if (start == 0) {
        readbooks = 0;

        for (let s = start + count; s < total; s += count) {
            jsonp(url + `&start=${s}`);
        }
    }

    page['books'].forEach(book => {
        if (parseFloat(book['rating']['average']) > 0) {
            books.push(book);
        }
    });

    readbooks += count;

    var progress = document.getElementById("searching-progress");
    progress.value = `${Math.ceil(readbooks / total * 100)}`;
    
    if (readbooks >= total) {
        bayesian(books);
        books.sort((a, b) => {
            return b['rating']['bayesian'] - a['rating']['bayesian'];
        });
        showBooks();
    }
}

function bayesian(books) {
    let allRaters = 0;
    let allScore = 0;
    for (let book of books) {
        const n = book['rating']['numRaters'];
        allRaters += n;
        allScore += n * parseFloat(book['rating']['average']);
    }
    const C = allRaters / books.length;
    const m = allScore / allRaters;
    for (let book of books) {
        const n = book['rating']['numRaters'];
        book['rating']['bayesian'] = (C * m + n * parseFloat(book['rating']['average'])) / (C + n)
    }
}
function addHref(url,li,txt) {
    const a = document.createElement("a");
    a.target = '_blank';
    a.href = url;
    li.appendChild(a);
    a.appendChild(document.createTextNode(txt));
}
function showBooks() {
    const progress = document.getElementById("searching-progress");
    progress.hidden = true;
    const ul = document.getElementById("search-result-list");
    for (let book of books) {
        const li = document.createElement("li");
        ul.appendChild(li);
        const url = book['alt'];
        let title = book['title'];
        if (book['subtitle'].length > 0)
            title += ": " + book['subtitle'];
        const text = `${book['rating']['bayesian'].toFixed(2)} - ${title}`;
        addHref(url,li,text);
        li.appendChild(document.createTextNode(" "));
        addHref(`http://zhannei.baidu.com/cse/search?s=1841543737020962857&entry=1&q=${title}`,li,"下载1");
        li.appendChild(document.createTextNode(" "));
        addHref(`https://www.baidu.com/s?wd=site%3Ajava1234.com%20${title}`,li,"下载2");

    }
}