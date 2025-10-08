//using UnityEngine;
//using ClusterVR.CreatorKit.Gimmick;
//using ClusterVR.CreatorKit.Operation;

//[System.Serializable]
//public class GliderData
//{
//    public float roll;
//    public float pitch;
//    public float yaw;
//}

//public class GliderReceiver : MonoBehaviour, IReceiveGimmick
//{
//    public void Receive(GimmickValue value, GimmickTrigger trigger)
//    {
//        try
//        {
//            var json = value.ToString();
//            var data = JsonUtility.FromJson<GliderData>(json);

//            transform.rotation = Quaternion.Euler(data.pitch, data.yaw, data.roll);
//        }
//        catch
//        {
//            Debug.Log("Parse error");
//        }
//    }
//}
