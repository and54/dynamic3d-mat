
module.exports.translateTimeline = (text) => {
    let timeline = {}
    let timeline_array = text.split('\n').filter(v => !!v);
    timeline['subheader'] = timeline_array[1]
    timeline_array.forEach((t, idx) => {
        if (idx >= 2 && !(idx % 2)) {
            timeline[t.trim()] = timeline_array[idx + 1]
        }
    })
    // console.log(timeline_array, timeline)
    Object.entries(timeline).forEach(([year, val]) => {
        $(`#timeline-${year}`).html(val)
    })
}




module.exports.translateCareCopy = (k, v) => {
    const copyNumIcons = {
        2: 'img/icons/ico_maintain.svg',
        3: 'img/icons/ico_spills.svg',
        4: 'img/icons/ico_special.svg',
    }
    let copy_match = k.match(/\d/);
    if (copy_match) {
        let num = copy_match[0];
        $(`#care_cleaning_guide_cta_${num}`).click((e) => {

            let list = v.text.split(/\n\d\./);
            // console.log(list)
            let itemDivs = list.slice(1).map((l, idx) => `<div>${idx + 1}. ${l}</div><br />`)
            // console.log(itemDivs)
            $('.modal-title').html(`<img class='resources-title-icon' src=${copyNumIcons[num]}></img>${list[0]}`)
            $('.modal-body').html(itemDivs)
        })
    }
}
