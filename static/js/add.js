document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("myModal");
    const openModalButton = document.getElementById("openModal");
    const closeModalButton = document.getElementsByClassName("close")[0];
  
    // 모달 열기
    openModalButton.onclick = function() {
      modal.style.display = "block";
    }
  
    // 모달 닫기
    closeModalButton.onclick = function() {
      modal.style.display = "none";
    }
  
    // 모달 외
  