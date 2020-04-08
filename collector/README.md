# Test locally
npm start
curl localhost:8080/topic/tmp?foo=bar

curl localhost:8080/headers

curl localhost:8080/keepalive

curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"name": "testCookie", "value": "testValue", "options": {"domain": "domain", "maxAge": 6000}}' \
  http://localhost:8080/topic/tmp?foo=bar

curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"name": "testCookie", "value": "testValue", "options": {"domain": "domain", "maxAge": 6000}}' \
  http://localhost:8080/cookies

  # Deploy Cloud Functions from shell
  gcloud functions deploy collector --region europe-west1 --runtime nodejs10 --trigger-http --allow-unauthenticated --max-instances 5 --set-env-vars TOPIC=tmp,ALLOW_ORIGIN=*,PLATFORM=CF

  # Build container Cloud Run
  gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/collector

  # Deploy to app engine standard
  gcloud app deploy app.standard.yaml
  create a cloud build file that pull code from git, generate a app.yaml that replace existing and deploy with gcloud command