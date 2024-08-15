let path, viewer3d, panorama360, renderCont, collectionSel, sectionName, fileInfo, firstMat, resetMethod, selCatBtn, postLoaded, mapsLoading, mapsLoaded;
let prod_detail_text = 'Product Details';

// initilizer

const init3d = async (iniPath) => {
  path = iniPath;
  viewer3d = document.getElementsByTagName('viewer-3d')[0];
  panorama360 = document.getElementsByTagName('panorama-360')[0];
  renderCont = document.getElementById('render-container');

  viewer3d.setAttribute('path', path);
  panorama360.setAttribute('path', path);

  viewer3d.addEventListener('onchangeinfo', viewerEvents);

  panorama360.addEventListener('onchangeinfo', evt => {
    console.log('onchangeinfo panorama360 >>', evt.detail);
  });

  $('#dropTrigger').on('show.bs.dropdown', () => rotateArrow(-180));
  $('#dropTrigger').on('hide.bs.dropdown', () => rotateArrow(0));

  window.onresize = resetElems;
  resetElems();

  const json = await initLoader(path);
  const name = window.location.hash?.substring(1);
  const category = await json[name];

  if (name && category) createDropDown(json, name);
}

const initLoader = async (path) => {
  const mainJson = {};
  const jsons = ['footwear', 'leather-goods', 'automobile'];
  for (let i = 0; i < jsons.length; i++) {
    const v = jsons[i];
    const data = await fetch(`${path}/jsonLoader/${v}.json`).then(response => response.json());
    mainJson[data.id] = buildJson(data);
  }
  return mainJson;
}

const buildJson = json => {
  const lang = getLang();
  json.name = json['name' + lang];
  json.sections.map(s => s.name = s['name' + lang]);
  json.data.map(d => {
    if (json.crossProps?.all) addCrossProps(d, json.crossProps.all);
    if (json.crossProps?.[d.section_id]) addCrossProps(d, json.crossProps[d.section_id]);
    d.description = d['description' + lang];
    d.properties.map(m => {
      if (d.type !== 'viewer-3d') m.image = `images/${json.id}/${d.section_id}/${d.id}/${m.id}_full.jpg`;
      m.thumb = `images/${json.id}/${d.section_id}/${d.id}/${m.id}_thumb.jpg`;
      m.name = m['name' + lang] || m.name;
    });
  });
  return json;
}

const addCrossProps = (json, props) => {
  for (let p in props) {
    if (Array.isArray(props[p])) json[p] = props[p].concat(json[p]);
    else json[p] = { ...props[p], ...json[p] };
  }
}

const getLang = () => {
  const name = 'NUVANT_LANG';
  return window.localStorage.getItem(name)?.toUpperCase() || 'EN';
}

const viewerEvents = evt => {
  console.log('onchangeinfo viewer3d >>', evt.detail);
  if (evt.detail.event === 'modelLoaded' && fileInfo.postLoad) applyProps(fileInfo.postLoad, true);
  else if (evt.detail.event === 'resetEvent') resetMethod = evt.detail.data;
  else if (evt.detail.event === 'mapLoaded') {
    mapsLoaded++;
    //console.log('mapLoaded', mapsLoaded, mapsLoading, Math.round(mapsLoaded/mapsLoading*100))
    if (mapsLoaded + 1 >= mapsLoading) {
      setTimeout(() => viewer3d.style.visibility = 'visible', 500);
      setTimeout(() => document.getElementById('content-loader').style.display = 'none', 1000);
      mapsLoaded = mapsLoading = 0;
    }
  }
}

const resetElems = () => {
  const drop = document.getElementById('dropCont');
  drop.style.left = window.innerWidth < 1440 ? 0 : `${(window.innerWidth - 1440) / 2}px`;
  if (selCatBtn) animateColBar();
}

// dropdown

const createDropDown = (json, name) => {
  const colls = document.getElementById('categories');
  const dropItems = document.getElementById('dropItems');
  const colIds = [];

  collectionSel = json[name];

  document.getElementById('dropdown-icon').setAttribute('srcset', `./img/icons/${collectionSel.icon}.svg`);
  document.getElementById('dropdown-title').innerHTML = collectionSel.name.toUpperCase();

  colls.innerHTML = dropItems.innerHTML = '';
  for (let i in json) { colIds.push({ name: json[i].name.toUpperCase(), icon: json[i].icon, id: i, order: json[i].order }) };
  colIds.filter(v => v.id != name).sort((a, b) => a.order - b.order).map((v, i) => {
    if (!(i % 3) && i) createButton(dropItems, '', 'w-100', null);
    const item = `<div class="dropdown-btn-content">
      <img class="dropdown-icon" srcset="./img/icons/${v.icon}.svg">
      <div class="dropdown-text">${v.name}</div>
    </div>`
    createButton(dropItems, item, 'dropdown-item col', () => {
      window.location = `/#${v.id}`;
      setTimeout(() => window.location.reload(), 200);
    });
  });
  document.getElementById('dropCont').style.visibility = 'visible';
  createCategories(colls, collectionSel.sections);
}

const rotateArrow = (angle = 0) => {
  const arr = document.getElementById('dropdown-arrow');
  const anim = arr.animate({ transform: `rotate(${angle}deg)` }, { duration: 400, easing: 'ease-out' });
  anim.onfinish = () => arr.style.transform = `rotate(${angle}deg)`;
}

// 3d model

const changeModel = modelInfo => {
  fileInfo = modelInfo;
  mapsLoading = mapsLoaded = 0;
  viewer3d.setAttribute("model", "");
  viewer3d.setAttribute("model", fileInfo.model || fileInfo);
  if (fileInfo.camprops) viewer3d.setAttribute("camProps", JSON.stringify(fileInfo.camprops));
  if (fileInfo.visorprops) viewer3d.setAttribute("visorprops", JSON.stringify(fileInfo.visorprops));
  if (fileInfo.lightprops) viewer3d.setAttribute("lightprops", JSON.stringify(fileInfo.lightprops));
}

// categories' buttons

const animateColBar = () => {
  let colBar = document.getElementById('category-sel-bar');
  const pos = selCatBtn.getBoundingClientRect();
  const animData = {
    left: `${Math.round(pos.left)}px`,
    width: `${Math.round(pos.width)}px`
  }
  const anim = colBar.animate(animData, { duration: 1000, easing: 'ease-out' });
  anim.onfinish = () => {
    colBar.style.left = animData.left;
    colBar.style.width = animData.width;
  }
}

const createCategories = (colls, data) => {
  let firstData;
  //sortString(data, 'name')
  data.sort((a, b) => a.order - b.order).map(data => {
    const btn = createButton(colls, `<p>${data.name}</p>`, 'category-button', () => selectCategory(data, btn));
    if (!firstData) firstData = { btn, data };
  });
  if (firstData) selectCategory(firstData.data, firstData.btn);
}

const selectCategory = (category, btn) => {
  selCatBtn = btn;
  sectionName = category.name;
  const butts = document.getElementsByClassName('category-button');
  Array.from(butts).map(b => b.className = 'category-button');
  selCatBtn.className += ' category-button-selected';
  animateColBar();
  //
  createSwatches(collectionSel.data.filter(v => v.section_id === category.id));
}

// swatches' accordions

const createSwatches = data => {
  const butts = document.getElementById('materials');
  butts.innerHTML = '';
  sortString(data, 'name').sort((a, b) => a.order - b.order).map((v, i) => {
    // data-toggle="collapse"
    const item = `<div id="${v.name}" class="swatch-div" data-target="#${v.id}" aria-expanded="true" aria-controls="${v.id}">
        <p>${v.name}</p>
        <div class="swatch-div-line"></div>
      </div>
      <div id="${v.id}" class="collapse ${i ? 'show' : 'show'} row" aria-labelledby="${v.name}" data-parent="#materials"></div>`;
    createButton(butts, item, '', null);
    const materialContainer = document.getElementById(v.id);
    createMaterials(v, materialContainer, !i);
  })
}

// materials' buttons

const createMaterials = (data, container, select) => {
  if (select) firstMat = null;
  sortString(data.properties, 'name').sort((a, b) => a.order - b.order).map((v, i) => {
    if (!(i % 3) && i) createButton(container, '', 'w-100', null);
    const item = `<div class="material-button-image" style="background-image: url('${path + v.thumb}')"></div>
      <div class="material-overlay">
        <div class="material-overlay-icon">i</div>
      </div>
      <div class="material-button-text">
        <div class="material-button-title">${v.name}</div>
        <div class="material-button-details">
          ${prod_detail_text}
          <img class="material-arrow" srcset="./img/icons/ico_arrow.svg">
        </div>
      </div>`;
    const btn = createButton(container, item, 'material-button', () => selectMaterial(btn, data, v));
    if (!firstMat && select) firstMat = btn;
  })
  if (select) {
    if (data.type === 'viewer-3d') changeModel(data);
    else firstMat.dispatchEvent(new Event('click'));
    //
    const elems = { 'viewer-3d': viewer3d, 'panorama-360': panorama360, render: renderCont };
    viewer3d.style.display = panorama360.style.display = renderCont.style.display = 'none';
    elems[data.type].style.display = 'block';
  }
}

const selectMaterial = (btn, category, data) => {
  mapsLoading = mapsLoaded = 0;
  if (btn.classList.contains('material-button-selected')) showDetails(data, category);
  else {
    const butts = document.getElementsByClassName('material-button');
    Array.from(butts).map(b => b.className = 'material-button');
    btn.className += ' material-button-selected';
    viewer3d.setAttribute('material', null);
    if (category.type === 'viewer-3d') {
      const lights = data.lightprops ? JSON.stringify(data.lightprops) : category.lightprops ? JSON.stringify(category.lightprops) : '';
      viewer3d.setAttribute("lightprops", lights);
      if (category.camprops) viewer3d.setAttribute("camProps", JSON.stringify(category.camprops));
      if (category.visorprops) viewer3d.setAttribute("visorprops", JSON.stringify(category.visorprops));
      if (postLoaded !== JSON.stringify(category.postLoad)) applyProps(category.postLoad, true);
    } else document.getElementById('content-loader').style.display = 'none';
    category.type === 'viewer-3d' ? applyProps(data.materials) : category.type === 'panorama-360' ? changePanorama(data.image) : changeRender(data.image);
    moveDetail(false);
  }
}

const applyProps = (props, post = false) => {
  mapsLoading += props.reduce((pv, cv) =>
    pv + Object.keys(cv).reduce((pvi, cvi) => pvi +
      +(!!(cvi.toLowerCase().indexOf('map') + 1) &&
        !(cvi.toLowerCase().indexOf('mapprops') + 1) &&
        !(cvi.toLowerCase().indexOf('envmap') + 1) &&
        !!cv[cvi])
      , 0), 0);
  if (mapsLoading > mapsLoaded + 1) {
    viewer3d.style.visibility = 'hidden';
    document.getElementById('content-loader').style.display = 'block';
  }
  props.map((v, i) => setTimeout(() => viewer3d.setAttribute('material', JSON.stringify(v)), i * 200));
  if (firstMat) setTimeout(() => {
    if (firstMat) firstMat.dispatchEvent(new Event('click'));
    firstMat = null;
  }, props.length * 200);
  if (post) postLoaded = JSON.stringify(props);
}

const changePanorama = img => {
  panorama360.setAttribute('image', img);
  firstMat = null;
}

const changeRender = img => {
  renderCont.style.backgroundImage = `url('${path + img}')`;
  firstMat = null;
}

// material detail

const showDetails = (data, category) => {
  document.getElementById('mat-detail-img').style.backgroundImage = `url('${path + data.thumb}')`;
  document.getElementById('mat-detail-title').innerHTML = data.name;
  document.getElementById('mat-detail-subtitle').innerHTML = `${collectionSel.name} / ${sectionName} / ${category.name}`;
  document.getElementById('mat-detail-desc').innerHTML = category.description;
  const icons = document.getElementById('mat-detail-icons');
  icons.innerHTML = '';
  category.certifications.map((v, i) => {
    if (!(i % 3) && i) createButton(icons, '', 'w-100', null);
    icons.innerHTML += `<div class="mat-detail-cert" style="background-image: url('${path}certifications/${v}.jpg')"></div>`;
  });
  moveDetail(true);
}

const moveDetail = open => {
  const matDet = document.getElementById('mat-detail');
  let matsAnimData, matDetAnimData;
  if (isMobile()) matDetAnimData = { opacity: +open, visibility: open ? 'visible' : 'hidden' };
  else {
    const mats = document.getElementById('materials');
    matsAnimData = { right: open ? '450px' : 0 };
    matDetAnimData = { right: open ? 0 : '-450px' };
    const animMats = mats.animate(matsAnimData, { duration: 500, easing: 'ease-in-out' });
    animMats.onfinish = () => addStyles(mats, matsAnimData);
  }
  const animMatDet = matDet.animate(matDetAnimData, { duration: 500, easing: 'ease-in-out' });
  animMatDet.onfinish = () => addStyles(matDet, matDetAnimData);
}

// generic

const createButton = (container, content, classes, click) => {
  const btn = document.createElement('DIV');
  btn.innerHTML = content;
  btn.className = classes;
  btn.onclick = click;
  container.appendChild(btn);
  return btn;
}

const addStyles = (ele, data) => {
  for (let i in data) ele.style[i] = data[i];
}

const sortString = (data, field) => data.sort((a, b) => a[field].toUpperCase() > b[field].toUpperCase() ? 1 : -1);

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
