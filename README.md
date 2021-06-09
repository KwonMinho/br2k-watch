## Dev Log

### CORS 정책 문제

kube-api server의 config 변경해줘야함.

/etc/kubernetes/manifests/kube-apiserver.yaml

add) command > kube-apiserver > --cors-allowed-origins="http://*"

### 웹 브라우저 상에서 insecure 통신

웹 브라우저 상에서는 secure 통신을 하는 게 기본.

프로그래밍적으로 insecure 옵션을 줄 수 없다.

강제변경: https://medium.com/idomongodb/chrome-bypassing-ssl-certificate-check-18b35d2a19fd

- "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --ignore-certificate-errors

추가된 것(완벽해결ㄴㄴ)
쿠버네티스 ca.cert를 가져와서 설치하는 법 -https://javafactory.tistory.com/1520

## 추가

- 가져온 시간 보여주기
