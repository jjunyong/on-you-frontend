import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Tabs from "./Tabs";
import ClubCreationStack from "./ClubCreationStack";
import ClubStack from "./ClubStack";
import ProfileStack from "./ProfileStack";
import ClubManagementStack from "./ClubManagementStack";
import FeedStack from "./FeedStack";
import { Host } from "react-native-portalize";
import { useToast } from "react-native-toast-notifications";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store/reducers";
import axios from "axios";
import { useAppDispatch } from "../redux/store";
import { logout, updateUser } from "../redux/slices/auth";
import { DeviceEventEmitter } from "react-native";
import { BaseResponse, ErrorResponse, TargetTokenUpdateRequest, UserApi, UserInfoResponse } from "../api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import feedSlice from "../redux/slices/feed";
import messaging from "@react-native-firebase/messaging";
import notifee, { EventType } from "@notifee/react-native";
import { useNavigation } from "@react-navigation/native";

const Nav = createNativeStackNavigator();

const Root = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const fcmToken = useSelector((state: RootState) => state.auth.fcmToken);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const { refetch: userInfoRefecth } = useQuery<UserInfoResponse, ErrorResponse>(["getUserInfo", token], UserApi.getUserInfo, {
    onSuccess: (res) => {
      if (res.data) dispatch(updateUser({ user: res.data }));
    },
    onError: (error) => {
      console.log(`API ERROR | getUserInfo ${error.code} ${error.status}`);
      toast.show(`${error.message ?? error.code}`, { type: "warning" });
    },
    enabled: false,
  });

  const updateTargetTokenMutation = useMutation<BaseResponse, ErrorResponse, TargetTokenUpdateRequest>(UserApi.updateTargetToken);

  const updateTargetToken = (fcmToken: string | null) => {
    const requestData: TargetTokenUpdateRequest = {
      targetToken: fcmToken,
    };
    updateTargetTokenMutation.mutate(requestData, {
      onSuccess: (res) => {
        console.log(`API CALL | updateTargetToken : ${fcmToken}`);
      },
      onError: (error) => {
        console.log(`API ERROR | updateTargetToken ${error.code} ${error.status}`);
        toast.show(`${error.message ?? error.code}`, { type: "warning" });
      },
    });
  };

  useEffect(() => {
    console.log(`Root - useEffect!`);

    // Axios Setting
    axios.defaults.baseURL = "http://3.39.190.23:8080";
    if (token) axios.defaults.headers.common["Authorization"] = token;
    axios.defaults.headers.common["Content-Type"] = "application/json";

    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        config.timeout = 5000;
        return config;
      },
      (error) => error
    );
    const responseInterceptor = axios.interceptors.response.use(
      (response) => ({ ...response.data, status: response.status }), // 2xx
      async (error) => {
        // 2xx 범위 밖
        if (error.response) {
          const status = error.response.status;
          if (status === 400) {
            if (!error.response.data) error.response.data = { message: "잘못된 요청입니다." };
          } else if (status === 401) {
            DeviceEventEmitter.emit("Logout", { fcmToken });
            toast.show(`중복 로그인이 감지되어\n로그아웃 합니다.`, { type: "warning" });
          } else if (status === 500) {
            error.response.data = { message: "알 수 없는 오류" };
          }
          return Promise.reject({ ...error.response?.data, status, code: error.code });
        } else {
          return Promise.reject({ message: "요청시간이 만료되었습니다.", code: error.code });
        }
      }
    );

    userInfoRefecth();
    queryClient.resetQueries(["feeds"]);

    if (fcmToken) updateTargetToken(fcmToken);

    //푸시를 받으면 호출됨
    const fcmUnsubscribe = messaging().onMessage(async (remoteMessage) => {
      try {
        await notifee.displayNotification({
          title: remoteMessage?.notification?.title,
          body: remoteMessage?.notification?.body,
          android: {
            channelId: "club",
          },
        });
      } catch (e) {
        console.warn(e);
      }
    });

    const notiUnsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log("User dismissed notification", detail.notification);
          break;
        case EventType.PRESS:
          console.log("User pressed notification", detail.notification);
          break;
        case EventType.ACTION_PRESS:
          console.log(`Action Press: ${detail.pressAction?.id}`);
          break;
      }
    });

    const logoutSubScription = DeviceEventEmitter.addListener("Logout", async ({ fcmToken, isWitdrawUser }) => {
      console.log(`Root - Logout`);
      const res = await dispatch(logout());
      if (res.meta.requestStatus === "fulfilled") {
        if (!isWitdrawUser) toast.show(`로그아웃 되었습니다.`, { type: "success" });
        try {
          if (fcmToken && !isWitdrawUser) updateTargetToken(null);
          if (!fcmToken) console.log(`Root - Logout : FCM Token 이 없습니다.`);
          dispatch(feedSlice.actions.deleteFeed());
        } catch (e) {
          console.warn(e);
        }
      } else toast.show(`로그아웃 실패.`, { type: "warning" });
    });

    return () => {
      console.log(`Root - remove!`);
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
      logoutSubScription.remove();
      fcmUnsubscribe();
      notiUnsubscribe();
    };
  }, []);

  return (
    <Host
      children={
        <Nav.Navigator
          screenOptions={{
            presentation: "card",
            headerShown: false,
          }}
        >
          <Nav.Screen name="Tabs" component={Tabs} />
          <Nav.Screen name="ClubCreationStack" component={ClubCreationStack} />
          <Nav.Screen name="ClubManagementStack" component={ClubManagementStack} />
          <Nav.Screen name="ClubStack" component={ClubStack} />
          <Nav.Screen name="ProfileStack" component={ProfileStack} />
          <Nav.Screen name="FeedStack" component={FeedStack} />
        </Nav.Navigator>
      }
    ></Host>
  );
};
export default Root;
