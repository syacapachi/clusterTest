// ClusterScript (ItemScript) - sample
// 使い方:
//  1) Creator Kit の外部通信でエンドポイント登録 -> Endpoint ID を取得
//  2) 下の YOUR_ENDPOINT_ID を置き換えてアップロード

// ====== 設定 ======
const ENDPOINT_ID = new ExternalEndpointId("1c66a0dc-4e36-4719-9311-6c4a3083d26e"); // Creator Kit で作成した Endpoint ID（例: "_legacy_single_endpoint" でも可）
const REQUEST_COOLDOWN = 0.4; // 外部サーバーへ飛ばす間隔（秒）。過負荷にならないよう適切に設定してください。
const REQUEST_META = "setPositionFromServer"; // 任意のメタ文字列（サーバー側で識別に使える）
// ==================

// 操作対象の SubNode（アイテム内の移動対象ノード名）を取得
// ルート自分自身を動かすなら $.subNode("") ではなく $.setPosition 等を使う（下の例は subnode を想定）
const TARGET_NODE_NAME = "ModelParent"; // 空文字列ならアイテム本体（ルート）を想定

$.onRide(isGetOn =>{
  $.state.target = isGetOn ? $.subNode(TARGET_NODE_NAME) : null;
})

$.onStart(() => {
  // 対象ノードを見つける（なければルートとして扱う）
  try {
    if (TARGET_NODE_NAME && TARGET_NODE_NAME.length > 0) {
      $.state.target = $.subNode(TARGET_NODE_NAME);
      $.log("target node: " + TARGET_NODE_NAME + " -> " + ($.state.target ? "found" : "NOT found"));
    } else {
      // ルートの SubNode を取得（API により null/undefined の場合があるので guard）
      $.state.target = $.subNode("");
      if (!$.state.target) {
        // fallback: top-level の setPosition がサポートされている場合は $.setPosition を使う
        $.state.target = null;
      }
      $.log("target node: root -> " + ($.state.target ? "found subNode" : "use top-level setPosition if available"));
    }
  } catch (e) {
    $.log("target node get error: " + e);
    $.state.target = null;
  }

  // 初期 state を用意
  $.state.cooldown = 0;
  $.state.requesting = false;

  // 初回リクエスト（任意）
  //sendPositionRequest();
});

$.onUpdate((deltaTime) => {
  // クールダウン処理
  $.state.cooldown = ($.state.cooldown || 0) - deltaTime;
  if ($.state.cooldown <= 0 && !($.state.requesting)) {
    // 送信間隔が来たら送る
    sendPositionRequest();
    $.state.cooldown = REQUEST_COOLDOWN;
  }
});

// 外部サーバーにリクエストを投げるラッパー
function sendPositionRequest() {
  try {
    // サーバーへ投げる内容（文字列化して送る）
    // 必要に応じて player 情報や itemId などを含める（ただしプライバシーに注意）
    const payload = {
      type: "getTargetPosition",
      // itemId: $.getItemHandle ? $.getItemHandle().id : null, // 存在する API の場合のみ
      // timestamp: Date.now()  //送信データを最小限にした  
    };
    const requestString = JSON.stringify(payload);

    // Endpoint を指定して呼ぶ（Endpoint を指定しない場合は Creator Kit のレガシーエンドポイントが使われる）
    const endpointObj = new ExternalEndpointId(ENDPOINT_ID); // ENDPOINT_ID を Creator Kit で登録した値に置き換える

    // callExternal(endpointId, requestString, meta)
    $.callExternal(endpointObj, requestString, REQUEST_META);
    // endpointId: ExternalEndpointId オブジェクト（または legacy ID）
    // requestString: サーバーへ送った文字列
    $.state.requesting = true;
    //$.log("callExternal sent: " + requestString);
  } catch (e) {
    $.log("callExternal error: " + e);
    $.state.requesting = false;
  }
}

// 外部サーバーから返ってきたときに呼ばれる（ドキュメント通り onExternalCallEnd）
$.onExternalCallEnd((response, meta, errorReason) => {
  // response: サーバーから返されたオブジェクト { verify(認証トークン), response(読み取れるのはここ) }
  // meta: callExternal 呼び出し時に渡した meta（上では REQUEST_META）
  // errorReason: response がnullな理由 

  // 受信するJsonの構造
  // {verify: true, response: responseString}} 
  // responseString = '{"response": responseBodyString}'}' //reponse内にresponseがある
  // responseBodyString = '{"unity_pos":{"x":1.2,"y":0.5,"z":-3.4}}' //responseBodyString内にunity_posがある
  //アクセス手段(短くしたい場合)
  //const unity_pos = Json.parse(Json.parse(response).response).unity_pos
  $.state.requesting = false;
  //$.log("response =>" + response);
  // サーバーとの通信でエラーが発生した場合にその理由を表示
  if (response == null) {
      $.log("callExternal ERROR: " + errorReason);
      return;
  }
  if (meta !== REQUEST_META) {
      $.log("Unknown meta in onExternalCallEnd: " + meta);
      return;
  }
  try {
    if (!response) {
      $.log("No response payload");
      return;
    }
    // response は JSON 文字列化されたオブジェクトなので parse する
    let parsedResponse = JSON.parse(response);
    
    const datas = parsedResponse.responsedata;
    if (!datas) {
      $.log("Empty response.responsedata");
      return;
    }

    if (typeof datas.unity_pos.x === "number" && typeof datas.unity_pos.y === "number" && typeof datas.unity_pos.z === "number") {
      const newPos = new Vector3(datas.unity_pos.x, datas.unity_pos.y, datas.unity_pos.z);
      //$.log(`parsed position: (${newPos.x}, ${newPos.y}, ${newPos.z})`);
      // 位置設定の方法は対象（PlayerScript / ItemScript / SubNode）によって変わります。
      if ($.state.target && typeof $.state.target.setPosition === "function") {
        // SubNode あるいはサブノードを動かす場合
        $.state.target.setPosition(newPos);
        //$.log(`moved target node to (${newPos.x}, ${newPos.y}, ${newPos.z})`);
      } else if (typeof $.setPosition === "function") {
        // ルートのアイテム自体を動かす（トップレベル setPosition がサポートされていれば）
        $.setPosition(newPos);
        //$.log(`moved item to (${newPos.x}, ${newPos.y}, ${newPos.z})`);
      } else {
        $.log("No suitable API to set position available in this context.");
      }
    } else {
      $.log("Response JSON missing x,y,z numeric fields: " + JSON.stringify(datas));
    }
  } catch (e) {
    $.log("onExternalCallEnd error: " + e);
    /*
    onExternalCallEnd error: TypeError: No public methods with the specified arguments were found.
    */
  }
});

/*
Json.stringify と Json.parse は玉ねぎ

stringifyしたjson1を埋め込んだjson2をstringifyしたjson3
json3 =>ただのstring
paese(json3) =>json3のキーと値のペアを持つobjectは復元されるが,json2はstringのまま
paese(json2) =>json2のキーと値のペアを持つobjectは復元されるが,json1はstringのまま
paese(json1) =>json1のキーと値のペアを持つobjectが復元される

Json.stringify, Json.parse の挙動まとめ
stringifyは、オブジェクトのキーと値のペアを文字列に変換する
変換方法
key:value -> "key":value
2回目以降は、
valueがstringなら "key":"value"
valueがnumberなら "key":number
valueがbooleanなら "key":boolean
valueがnullなら "key":null
valueがobjectなら "key":stringify(value)//深くなるため、一回のparseでは復元されない
valueがarrayなら "key":stringify(value)//深くなるため、一回のparseでは復元されない

parseは、文字列をオブジェクトのキーと値のペアに変換する
変換方法 
"key":value -> key:value
valueが"string"なら key:"string"
valueがnumberなら key:number
valueがbooleanなら key:boolean
valueがnullなら key:null
valueがobjectなら key:parse(value)
valueがarrayなら key:parse(value)

ただし、
stringify, parse は再帰的に処理されるわけではなく、1回ずつしか処理されない

stringify で object -> string
parse で string -> object
入れ子でも同じ
jsonbase = 
{
  key1 : object, 
}
Json.stringify(jsonbase) =
{
  "key1" : "object" // object は string に変換される
}

json =
{
  key1 : object,
  key2 : jsonbase,
  key3 : Json.stringify(jsonbase), 
  key4 : 
  {
    key5 : object,
    key6 : jsonbase,
    key7 : Json.stringify(jsonbase)
  }
}
Json.stringify(json) =
{
  "key1" : "object", // object は string に変換される
  "key2" : {\"key1\" : "object"}, // json形式のobject も 同じくでstring に変換される
  "key3" : "{\"key1\":{object as string}}",
  "key4" : 
  {
    "key5" : "object",
    "key6" : {object as string},
    "key7" : "{\"key1\":{object as string}}"
  }
} 
*/