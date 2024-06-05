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