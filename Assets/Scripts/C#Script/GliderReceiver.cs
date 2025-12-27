//using UnityEngine;
//using ClusterVR.CreatorKit.Gimmick;
//using ClusterVR.CreatorKit.Item;
//using System;

//namespace ClusterVR.CreatorKit.Gimmick.Implements
//{
//    [System.Serializable]
//    public class GliderData
//    {
//        public float roll;
//        public float pitch;
//        public float yaw;
//    }

//    public class GliderReceiver : MonoBehaviour, IItemGimmick
//    {
//        public GimmickTarget Target => throw new NotImplementedException();

//        public string Key => throw new NotImplementedException();

//        public ItemId ItemId => throw new NotImplementedException();

//        public ParameterType ParameterType => throw new NotImplementedException();

//        public void Run(GimmickValue value, DateTime _)
//        {
//            try
//            {
//                var json = value.ToString();
//                var data = JsonUtility.FromJson<GliderData>(json);

//                transform.rotation = Quaternion.Euler(data.pitch, data.yaw, data.roll);
//            }
//            catch
//            {
//                Debug.Log("Parse error");
//            }
//        }
//    }
//}