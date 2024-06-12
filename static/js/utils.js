const API_DOMAIN = 'https://myrefrigerator.store';

export const createElementWithClass = (
    tagName,
    classNameList,
    textString,
    htmlString
) => {
    let nodeElement = document.createElement(tagName);
    if (classNameList) {
        nodeElement.classList.add(...classNameList);
    }
    if (textString) {
        nodeElement.innerText = textString;
    }
    if (htmlString) {
        nodeElement.innerHTML = htmlString.toString().replaceAll("\n", "<br>");
    }
    return nodeElement;
};

export const removeFadeOut = (element) => {
    element.classList.add("slow-opacity-trans");
    element.style.opacity = 0;
    element.style.transform = "translateY(20px)";
    element.ontransitionend = (e) => {
        e.target.parentNode?.removeChild(e.target)
        e.target.classList.remove("slow-opacity-trans")
        e.target.ontransitionend = null;
    };
};
export const removeFadeOutImmediately = (element) => {
    element.classList.add("fast-opacity-trans");
    element.style.transform = "translateY(-15px)";
    element.style.opacity = 0;
    element.ontransitionend = (e) => {
        e.target.parentNode?.removeChild(e.target)
        e.target.classList.remove("fast-opacity-trans")
        e.target.ontransitionend = null;
    };
};
export const removeMatchingMsg = (id) => {
    const ID_SEPARATOR = "-";
    const idSplited = id.split(ID_SEPARATOR);
    const idNo = idSplited.at(-1);
    const selector = id.split(ID_SEPARATOR).at(0);
    if (idNo === "0" || idSplited.length === 1) {
        const selectionStr = "[id ^= '" + selector + "']";
        const previousMsgs = document
            .getElementById("myref_alert")
            .querySelectorAll(selectionStr);
        previousMsgs.forEach((prevElement) =>
            removeFadeOutImmediately(prevElement)
        );
    }
};
const appendFadeIn = (parentEl, targetEl, id) => {
    if (id) {
        removeMatchingMsg(id);
    }
    targetEl.classList.add("fast-opacity-trans");
    parentEl.appendChild(targetEl).focus();
    setTimeout(() => {
        targetEl.style.opacity = 1;
        targetEl.style.transform = "none";
        targetEl.ontransitionend = (e) => {
            e.target.classList.remove("fast-opacity-trans");
            e.target.ontransitionend = null;
        }
    }, 30);
};
export const promptAlertMsg = (
    type,
    msg,
    anchor,
    id
) => {
    const maxAlertMsgStack = 5;
    const disappearTimeInMilisec = 7000;
    const poppupArea = document.getElementById("myref_alert");
    const elementId = id || "DEFAULT_ALERT_ID";
    if (poppupArea.childElementCount >= maxAlertMsgStack) {
        removeFadeOutImmediately(poppupArea.firstElementChild);
    }

    const singleAlertMsg = createElementWithClass("div", ["msg", type]);
    if (anchor) {
        const aLinkMsg = createElementWithClass("a", null, msg);
        aLinkMsg.href = anchor;
        const spanArea = createElementWithClass("span", ["text"]);
        spanArea.appendChild(aLinkMsg);
        singleAlertMsg.appendChild(spanArea);
    } else {
        const textMsg = createElementWithClass("span", ["text"], null, msg);
        singleAlertMsg.appendChild(textMsg);
    }


    singleAlertMsg.id = elementId;

    setTimeout(() => {
        removeFadeOut(singleAlertMsg);
    }, disappearTimeInMilisec);
    appendFadeIn(poppupArea, singleAlertMsg, elementId);
};

export const getSubscriptionEndpoint = async () => {
    if (!('serviceWorker' in navigator)) {
        return ""
    }
    if (!navigator?.serviceWorker?.controller) {
        return "";
    }
    const service = await navigator?.serviceWorker?.ready;
    if (!service) return "";

    const pushSubs = await service?.pushManager?.getSubscription();
    if (!pushSubs) return "";
    return pushSubs?.endpoint || "";
};

export const getCurrentId = () =>
  window.location.pathname.replace(/\/$/, "").split("/").pop();

export const setFavorite = async (favoriteId) => {
    const endpointUrl = await getSubscriptionEndpoint();
    if (!endpointUrl) {
        promptAlertMsg('warn', '기기등록이 필요한 서비스입니다.\n홈 화면에서 기기등록을 진행해주세요.');
        return false;
    }
    const response = await fetch(`${API_DOMAIN}/api/user/favorite/`, {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'recipe_id': favoriteId ?? getCurrentId(),
            'endpoint': endpointUrl,
        }),

        
    });
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        promptAlertMsg('info', '즐겨찾기에 추가되었습니다.');
        return true;
    }
    promptAlertMsg('warn', respJson?.server_msg || '즐겨찾기 추가에 실패했습니다.');
    return false
}

export const deleteFavorite = async (favoriteId) => {
    const endpointUrl = await getSubscriptionEndpoint();
    if (!endpointUrl) {
        promptAlertMsg('warn', '기기등록이 필요한 서비스입니다.\n홈 화면에서 기기등록을 진행해주세요.');
        return false;
    }
    const response = await fetch(`${API_DOMAIN}/api/user/favorite/?${new URLSearchParams({
        'recipe_id': favoriteId ?? getCurrentId(),
        'endpoint': endpointUrl,
    }).toString()}`, {
        method: 'DELETE',
    });
    const respJson = await response.json();
    if (respJson.resp_code === 'RET000') {
        promptAlertMsg('info', '즐겨찾기에서 삭제되었습니다.');
        return true;
    }
    promptAlertMsg('warn', respJson?.server_msg || '즐겨찾기 삭제에 실패했습니다.');
    return false
}

export const formatNumberToWonVerbose = (amount, currencySuffix = "원") => {
  return (
    new Intl.NumberFormat("ko-KR", {
      notation: "compact",
      compactDisplay: "long",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount) + (currencySuffix || "")
  );
};

export const createElementWithClassV2 = (
    tagName,
    classNameList,
    attributes,
    datasets,
    children
) => {
    let nodeElement = document.createElement(tagName);
    if (classNameList) {
        nodeElement.classList.add(...classNameList);
    }
    if (attributes) {
        Object.entries(attributes).forEach(([attr, value]) => {
        switch (attr) {
            case "innerHtml": {
            nodeElement.innerHTML = value;
            break;
            }
            case "innerHTML": {
            nodeElement.innerHTML = value;
            break;
            }
            case "innerText": {
            nodeElement.innerText = value;
            break;
            }
            case "onclick": {
            nodeElement.onclick = value;
            break;
            }
            case "onchange": {
            nodeElement.onchange = value;
            break;
            }
            case "onscroll": {
            nodeElement.onscroll = value;
            break;
            }
            case "onmouseover": {
            nodeElement.onmouseover = value;
            break;
            }
            case "onmousemove": {
            nodeElement.onmousemove = value;
            break;
            }
            case "onmouseout": {
            nodeElement.onmouseout = value;
            break;
            }
            case "onsubmit": {
            nodeElement.onsubmit = value;
            break;
            }
            case "oninput": {
            nodeElement.oninput = value;
            break;
            }
            case "ontransitionend": {
            nodeElement.ontransitionend = value;
            break;
            }
            case "onwheel": {
            nodeElement.onwheel = value;
            break;
            }
            case "checked": {
            nodeElement.checked = value;
            break;
            }
            case "value": {
            nodeElement.value = value;
            break;
            }
            case "style": {
            Object.entries(value).forEach(([cssAttr, value]) => {
                nodeElement.style.setProperty(cssAttr, value);
            });
            break;
            }
            case "dataset": {
            Object.entries(value).forEach(([attr, value]) => {
                nodeElement.setAttribute(`data-${attr}`, value);
            });
            break;
            }
            case "class": {
            nodeElement.classList.add(...value);
            break;
            }
            default:
            nodeElement.setAttribute(attr, value);
        }
        });
    }
    if (datasets) {
        Object.entries(datasets).forEach(([attr, value]) => {
        nodeElement.setAttribute(`data-${attr}`, value);
        });
    }
    if (children) {
        children.forEach((el) => nodeElement.appendChild(el));
    }
    return nodeElement;
};

const createCarouselItemsForRecommend = (itemData) => {
    const carouselItem = createElementWithClassV2(
        "a",
        ["carousel-item"],
        {
            href: `https://crwlnoti.shop/products/${itemData?._id}/?src=banner`,
            target: "_blank",
        },
        {
            final_price: itemData?.final_price || 0,
        }
    );

    const itemImg = createElementWithClassV2("div", ["carousel-image"]);
    const imgSrc = createElementWithClassV2("img", [], {
        src: itemData?.thumb || "/assets/button.png",
        loading: "lazy",
        referrerpolicy: "no-referrer",
    });

    itemImg.appendChild(imgSrc);
    if (itemData?.hot) {
        const hotMark = createElementWithClassV2(
        "div",
        ["floating", "upper-left", "title-font", "text-highlight"],
        { innerHTML: "🔥" }
        );
        if (itemData.hot < 0.4) {
            hotMark.style.display = "none";
        } else {
            hotMark.style.opacity = Math.min(itemData.hot - 0.2, 1);
        }
        itemImg.appendChild(hotMark);
    }
    if (itemData?.renew) {
        const lowestTag = createElementWithClassV2(
        "div",
        ["floating", "upper-right", "text-tag", "title-font", "text-highlight"],
        { innerText: "역대최저가" }
        );
        itemImg.appendChild(lowestTag);
    } else if (itemData?.lowest) {
        const lowestTag = createElementWithClassV2(
        "div",
        ["floating", "upper-right", "text-tag", "title-font"],
        { innerText: "역대가" }
        );
        itemImg.appendChild(lowestTag);
    }
    const priceDownTag = createElementWithClassV2(
        "h4",
        ["floating", "bottom-right", "price-tag", "title-font"],
        { innerText: `-${formatNumberToWonVerbose(itemData?.price_down)}` }
    );
    if (itemData?.price_down) {
        itemImg.appendChild(priceDownTag);
    }
    const productTitle = createElementWithClassV2("h3", ["item-title"], {
        innerText: itemData?.title?.slice(0, 24),
    });

    const priceDisplay = createElementWithClassV2("div", ["title-font", "final-price"], {
        innerText: formatNumberToWonVerbose(itemData?.price),
    });
    carouselItem.appendChild(itemImg);
    carouselItem.appendChild(productTitle);
    carouselItem.appendChild(priceDisplay);

    const HIDDEN_STATUE = "pseudo-hidden-grow";
    carouselItem.classList.add(HIDDEN_STATUE);
    setTimeout(() => {
        carouselItem.classList.remove(HIDDEN_STATUE);
    }, 30);

    return carouselItem;
};

const fetchPriceDownBanner = async (keyword) => {
  const cidx = document.querySelectorAll(".carousel-item").length;
  if (cidx === -1) {
    return {};
  }
  const targetUrl = `https://api.crwlnoti.shop/v2/api/--/list/?cidx=${cidx}&big=로켓프레시&exclude_soldout=true&exclude_used=true&keyword=${keyword||""}`;
  return fetch(targetUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((resp) => resp.json())
    .catch((err) => {
      console.log(err);
      return {};
    })
    .then((data) => {
      if (data.resp_code !== "RET000") {
        return {};
      }
      return data.data;
    })
    .catch((err) => {
      console.log(err);
      return {};
    });
};
const createMagicBtnBriefDisplay = () => {
  const loadAllBtn = createElementWithClassV2("button", [], {
    innerText: "▶︎",
    id: "load-all",
    onmouseover: (e) => {
      e.stopPropagation();
      e.preventDefault();
      Array.from(e.target.parentNode.querySelectorAll(".additional")).forEach(
        (el) => {
          if (el.classList.contains("hidden-item")) {
            // 숨겨진 상태에서 open
            el.classList.remove("hidden-item");
            setTimeout(() => {
              el.classList.remove("fade-in");
            }, 30);
            e.target.innerText = "◀︎";
          }
        }
      );
    },
    onclick: (e) => {
      e.stopPropagation();
      e.preventDefault();
      Array.from(e.target.parentNode.querySelectorAll(".additional")).forEach(
        (el) => {
          if (el.classList.contains("hidden-item")) {
            // 숨겨진 상태에서 open
            el.classList.remove("hidden-item");
            setTimeout(() => {
              el.classList.remove("fade-in");
            }, 30);
            e.target.innerText = "◀︎";
          } else {
            el.classList.add("fade-in");
            el.ontransitionend = (evt) => {
              evt.target.classList.add("hidden-item");
              evt.target.ontransitionend = null;
              e.target.innerText = "▶︎";
            };
          }
        }
      );
    },
  });
  return loadAllBtn;
};

const getInferiorNodeByDataset = (node1, node2) => {
  const data1 = node1.dataset;
  const data2 = node2.dataset;

  const score1 =
    parseInt(data1.final_price || 0);

  const score2 =
    parseInt(data2.final_price || 0);

  if (score1 > score2) {
    return node1;
  } else if (score2 > score1) {
    return node2;
  } else {
    return node2; // Nodes have equal scores
  }
};
export const carouselItemsToBeAppended = async (keyword) => {
  const itemsArray = [];
  const bannerData = await fetchPriceDownBanner(keyword);
  bannerData?.display_list.forEach((elem, idx, arr) => {
    const ppid = elem.ids?.pid || 0;
    const lastPpid = idx ? arr[idx - 1]?.ids?.pid || 1 : 1;

    const carouselItem = createCarouselItemsForRecommend(elem);
    if (ppid === lastPpid) {
      const parentContainer = itemsArray.at(-1);
      if (!parentContainer.querySelector("#load-all")) {
        const loadAllBtn = createMagicBtnBriefDisplay();
        parentContainer.appendChild(loadAllBtn);
      }
      const refContent = parentContainer.querySelector(
        ".carousel-item:not(.additional)"
      );
      const inferiorContent = getInferiorNodeByDataset(
        refContent,
        carouselItem
      );
      inferiorContent.classList.add("hidden-item", "fade-in", "additional"); // 열등한 거를 hide

      parentContainer.insertBefore(
        carouselItem,
        inferiorContent === refContent
          ? refContent
          : parentContainer.querySelector("button")
      );
    } else {
      const carouselItemContainer = createElementWithClassV2(
        "div",
        ["carousel-item-container"],
        null,
        null,
        [carouselItem]
      );
      itemsArray.push(carouselItemContainer);
    }

    if (idx === arr.length - 1 && (bannerData?.display_list.length === 100)) {
      let intersectionObs = new IntersectionObserver(
        async (entries, observer) => {
          if (entries?.[0] && !entries[0].isIntersecting) {
            return;
          }
          const carouselItems = await carouselItemsToBeAppended();
          carouselItems.forEach((el) =>
            itemsArray.at(-1).parentNode.appendChild(el)
          );
          observer.unobserve(entries[0].target);
        }
      );
      intersectionObs.observe(itemsArray.at(-1));
    }
  });

  if (!bannerData?.display_list?.length) {
    const emptyElem = createCarouselItemsForRecommend({
      title: "지금은 조건에 맞는 상품이 없습니다",
      price_down: Number.POSITIVE_INFINITY,
      price: 0,
      url: "/?dest=fallback",
      thumbnail: "/assets/button.png",
      pid: 20220721,
      lowest: true,
      isInfo: true,
    });
    itemsArray.push(emptyElem);
  }
  return itemsArray;
};



const ingredientArea = (ingredients, ingredients404) => {
    const ingredientList = createElementWithClass('div', ['ingredient-list']);
    ingredients?.forEach(ingredient => {
        if (ingredients404?.includes(ingredient)) {
            ingredientList.appendChild(createElementWithClass('span', ['available-ingredient', 'missing'], ingredient));
        } else {
            ingredientList.appendChild(createElementWithClass('span', ['available-ingredient'], ingredient));
        }
        ingredientList.appendChild(createElementWithClass('span', ['ingredient-separator'], ', '));
    });
    return ingredientList;
}

export const createRecipeItem = (recipeData, isFavoriteView) => {
    const isFavorite = recipeData?.favorite || false;
    const foodImageHeader = createElementWithClass('div', ['food-image']);
    const thumbContainer = createElementWithClass('div', ['thumb-container']);
    const favoriteButton = createElementWithClass('button', ['star-button'], isFavorite ? '★' : '☆');
    favoriteButton.onclick = async (e) => {
        e.preventDefault();
        const isFavorite = e.target.innerHTML === '★';
        if (isFavorite) {
            if (await deleteFavorite(recipeData?._id)) {
                e.target.innerHTML = e.target.innerHTML === '☆' ? '★' : '☆';
                if (isFavoriteView) {
                    removeFadeOut(e.target.closest('.recipe-item'));
                }
            }
        } else {
            if (await setFavorite(recipeData?._id)) {
                e.target.innerHTML = e.target.innerHTML === '☆' ? '★' : '☆';
            }
        }
    }
    thumbContainer.appendChild(favoriteButton);
    const foodThumbnail = createElementWithClass('img');
    foodThumbnail.src = recipeData?.image;
    foodThumbnail.alt = recipeData?.title;
    foodThumbnail.loading = 'lazy';
    foodThumbnail.referrerpolicy = 'no-referrer';
    thumbContainer.appendChild(foodThumbnail);
    foodImageHeader.appendChild(thumbContainer);
    const cookTime = createElementWithClass('div', ['cook-time']);
    if (recipeData?.cook_time) {
        cookTime.textContent = `약 ${recipeData?.cook_time}분 소요`;
        cookTime.style.textAlign = 'center';
    }
    foodImageHeader.appendChild(cookTime);
    
    const foodHeader = createElementWithClass('div', ['food-header']);
    const foodName = createElementWithClass('div', ['food-name'], null, recipeData?.title);
    
    foodHeader.appendChild(foodName);
    
    const ingredientList = createElementWithClass('div', ['ingredient-list']);
    ingredientList.appendChild(ingredientArea(recipeData?.ingred, recipeData?.ingred404));
    if (recipeData?.matchingCount) {
        const matchingCount = createElementWithClass('div', ['matching-count'], `일치하는 재료: ${recipeData?.matchingCount}개`);
        matchingCount.style.paddingTop = '5px';
        ingredientList.appendChild(matchingCount);
    }
    
    const foodDetails = createElementWithClass('div', ['food-details']);
    foodDetails.appendChild(foodHeader);
    foodDetails.appendChild(ingredientList);


    const recipeItem = createElementWithClass('a', ['recipe-item']);
    if (recipeData?._id) {
        recipeItem.href = `/recipe/${recipeData?._id}`;
        recipeItem.id = recipeData._id;
        recipeItem.style.textDecoration = 'none';
    }
    recipeItem.appendChild(foodImageHeader);
    recipeItem.appendChild(foodDetails);

    return recipeItem;
}

export const requestRecommendRecipe = async () => {
    const userEndpoint = await getSubscriptionEndpoint();
    if (!userEndpoint) {
        return {};
    }
    try {
        const response = await fetch(`${API_DOMAIN}/api/recipe/recommended/?endpoint=${userEndpoint}`);
        const data = await response.json();
        return data;
    } catch (e) {
        console.error(e);
        return {};
    }
}