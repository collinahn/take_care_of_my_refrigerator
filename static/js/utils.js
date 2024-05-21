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
    element.style.transform = "translateY(-20px) scale(0.9)";
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