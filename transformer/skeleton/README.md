# Test locally
npm start

curl localhost:8080/keepalive

curl --header "Content-Type: application/json"   --request POST   --data '{"data":{"name":"testCookie","value":"testValue","options":{"domain":"domain","maxAge":6000}},"headers":{"user-agent":"curl/7.52.1","host":"localhost:8080"}, "attributes":{"namespace":"com.google.analytics.v1","name":"Hit","topic":"com.google.analytics.v1.Hit-collector"}}'   "http://localhost:8080/?backup=tmp"

  # Deploy Cloud Functions from shell
  gcloud functions deploy ga_proxy --region europe-west1 --runtime nodejs10 --trigger-http --allow-unauthenticated --max-instances 5 --set-env-vars MAIN_TOPIC=ga-proxy,ALLOW_ORIGIN=*