const COOKIE_NAME = "NUVANT_LANG"


module.exports.setCookie = (lang) => {
    localStorage.setItem(COOKIE_NAME, lang)

}

module.exports.getCookie = () => {
    let cookie = window.localStorage.getItem(COOKIE_NAME)
    return cookie
}