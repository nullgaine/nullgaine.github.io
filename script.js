function backToTop() {
  const position =
    document.documentElement.scrollTop || document.body.scrollTop;
  if (position) {
    window.requestAnimationFrame(() => {
      window.scrollTo(0, position - position / 10);
      backToTop();
    });
  }
}  //페이지 위로 올리기 + 애니메이션 추가 오래된 T스토리에서 발굴(감사합니다)
