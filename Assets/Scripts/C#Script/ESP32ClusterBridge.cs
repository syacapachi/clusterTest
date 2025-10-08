//using UnityEngine;
//using UnityEngine.Networking;
//using System.Collections;
//using System.IO.Ports.SerialPort;
//using System.Text;
//using System;
////これを他のUnityで実行(Pythonで書き直すことも可能)
//[System.Serializable]
//public class GliderData
//{
//    public float roll;
//    public float pitch;
//    public float yaw;
//}

//public class ESP32ClusterBridge : MonoBehaviour
//{
//    [Header("Serial Settings")]
//    public string portName = "COM5";  // ← 接続しているポート名に変更
//    public int baudRate = 115200;

//    [Header("Cluster API Settings")]
//    public string apiUrl = "https://api.cluster.mu/v1/worlds/XXXX/webtriggers/YYYY"; // ← 自分のTrigger URL
//    public string authToken = "Bearer ZZZZZZZZZ"; // ← 自分のトークンを入力
//    public float sendInterval = 0.3f;  // 送信間隔（秒）

//    SerialPort serial;
//    string latestLine = "";
//    float timer = 0f;

//    void Start()
//    {
//        try
//        {
//            serial = new SerialPort(portName, baudRate);
//            serial.Open();
//            serial.ReadTimeout = 50;
//            Debug.Log("✅ Serial port opened successfully!");
//        }
//        catch (Exception e)
//        {
//            Debug.LogError("❌ Failed to open serial port: " + e.Message);
//        }
//    }

//    void Update()
//    {
//        // UART受信
//        try
//        {
//            if (serial != null && serial.IsOpen)
//            {
//                string line = serial.ReadLine();
//                if (!string.IsNullOrEmpty(line))
//                {
//                    latestLine = line;
//                    Debug.Log("Received: " + line);
//                }
//            }
//        }
//        catch (TimeoutException) { }

//        // 一定間隔でCluster送信
//        timer += Time.deltaTime;
//        if (timer >= sendInterval && !string.IsNullOrEmpty(latestLine))
//        {
//            timer = 0f;
//            try
//            {
//                GliderData data = JsonUtility.FromJson<GliderData>(latestLine);
//                StartCoroutine(SendToCluster(data));
//            }
//            catch (Exception e)
//            {
//                Debug.LogWarning("JSON Parse Error: " + e.Message);
//            }
//        }
//    }

//    IEnumerator SendToCluster(GliderData data)
//    {
//        string json = JsonUtility.ToJson(data);
//        byte[] bodyRaw = Encoding.UTF8.GetBytes(json);

//        using (UnityWebRequest req = new UnityWebRequest(apiUrl, "POST"))
//        {
//            req.uploadHandler = new UploadHandlerRaw(bodyRaw);
//            req.downloadHandler = new DownloadHandlerBuffer();
//            req.SetRequestHeader("Content-Type", "application/json");
//            req.SetRequestHeader("Authorization", authToken);

//            yield return req.SendWebRequest();

//            if (req.result == UnityWebRequest.Result.Success)
//                Debug.Log("✅ Sent to Cluster: " + json);
//            else
//                Debug.LogWarning($"⚠️ Cluster send failed: {req.error}");
//        }
//    }

//    void OnDestroy()
//    {
//        if (serial != null && serial.IsOpen)
//        {
//            serial.Close();
//            Debug.Log("Serial port closed.");
//        }
//    }
//}
