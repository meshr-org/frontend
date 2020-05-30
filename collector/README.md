# Test locally
export ALLOW_ORIGINS=*
export API_KEYS=123
npm start
curl localhost:8080/property/tmp?foo=bar

curl localhost:8080/headers

curl localhost:8080/keepalive

curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"name": "testCookie", "value": "testValue", "options": {"domain": "domain", "maxAge": 6000}}' \
  "http://localhost:8080/namespace/com.google.analytics.v1/name/Hit?api_key=123&headers=user-agent,host"

curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"name": "testCookie", "value": "testValue", "options": {"domain": "domain", "maxAge": 6000}}' \
  http://localhost:8080/cookies

  # Deploy Cloud Functions from shell
  gcloud functions deploy ga_proxy --region europe-west1 --runtime nodejs10 --trigger-http --allow-unauthenticated --max-instances 5 --set-env-vars MAIN_TOPIC=ga-proxy,ALLOW_ORIGIN=*