import React, { useState, useEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TouchableOpacity, Text, Platform, KeyboardAvoidingView, DeviceEventEmitter, ActivityIndicator } from "react-native";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import styled from "styled-components/native";
import ImagePicker from "react-native-image-crop-picker";
import { useMutation } from "react-query";
import { useSelector } from "react-redux";
import { BaseResponse, ErrorResponse, UserApi, UserUpdateRequest } from "../../api";
import Collapsible from "react-native-collapsible";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import DatePicker from "react-native-date-picker";
import CustomText from "../../components/CustomText";
import { useToast } from "react-native-toast-notifications";
import CustomTextInput from "../../components/CustomTextInput";
import { RootState } from "../../redux/store/reducers";
import CircleIcon from "../../components/CircleIcon";

const Container = styled.ScrollView`
  padding-left: 15px;
  padding-right: 15px;
`;

const ImagePickerView = styled.View`
  width: 100%;
  height: 130px;
  align-items: center;
  margin: 20px 0;
`;

const ImagePickerWrap = styled.View<{ size: number }>`
  width: ${(props: any) => (props.size ? props.size + 5 : 0)}px;
  height: ${(props: any) => (props.size ? props.size + 5 : 0)}px;
  border-radius: ${(props: any) => (props.size ? props.size : 0)}px;
  justify-content: center;
  align-items: center;
  border: 1px;
  border-color: rgb(255, 255, 255);
  background-color: white;
  box-shadow: 1px 2px 1px rgba(0, 0, 0, 0.25);
  margin-top: 15px;
`;

const ImagePickerButton = styled.TouchableOpacity<{ size: number }>`
  width: ${(props: any) => (props.size ? props.size : 0)}px;
  height: ${(props: any) => (props.size ? props.size : 0)}px;
  border-radius: 50px;
  justify-content: center;
  align-items: center;
  border: 0.2px solid #c4c4c4;
`;

const ProfileText = styled(CustomText)`
  margin-top: 10px;
  font-size: 12px;
  font-weight: normal;
  color: #2995fa;
`;

const Form = styled.View`
  margin-bottom: 20px;
  padding: 0 5px;
`;

const Title = styled(CustomText)`
  color: #b0b0b0;
  font-size: 10px;
  line-height: 15px;
  margin-bottom: 10px;
`;

const Input = styled(CustomTextInput)`
  font-size: 14px;
  line-height: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #cecece;
  padding-bottom: 5px;
  color: black;
`;

const TextBtn = styled.TouchableOpacity``;

const ItemView = styled.View`
  margin: 5px 0px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(0, 0, 0, 0.1);
`;

const ItemText = styled(CustomText)`
  font-size: 14px;
  line-height: 21px;
  padding-bottom: 5px;
`;

const EditProfile: React.FC<NativeStackScreenProps<any, "EditProfile">> = ({ route: { params: userData }, navigation: { navigate, setOptions } }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [imageURI, setImageURI] = useState<string | null>(userData?.thumbnail);
  const [name, setName] = useState<string>(userData?.name);
  const [sex, setSex] = useState<string>(userData?.sex === "M" ? "남자" : "여자");
  const [birthday, setBirthday] = useState<string>(userData?.birthday);
  const [phoneNumber, setPhoneNumber] = useState<string>(userData?.phoneNumber);
  const [organizationName, setOrganizationName] = useState<string>(userData?.organizationName);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const toast = useToast();
  const imageSize = 85;

  const mutation = useMutation<BaseResponse, ErrorResponse, UserUpdateRequest>(UserApi.updateUserInfo, {
    onSuccess: (res) => {
      toast.show("저장에 성공하였습니다.", { type: "success" });
      navigate("Tabs", {
        screen: "Profile",
      });
    },
    onError: (error) => {
      console.log(`API ERROR | updateUserInfo ${error.code} ${error.status}`);
      toast.show(`${error.message ?? error.code}`, { type: "warning" });
    },
  });

  const onSubmit = () => {
    const data = {
      birthday,
      name,
      organization: organizationName,
      phoneNumber,
    };

    const splitedURI = new String(imageURI).split("/");

    const updateData: UserUpdateRequest =
      imageURI === null
        ? { data }
        : {
            image: {
              uri: Platform.OS === "android" ? imageURI : imageURI.replace("file://", ""),
              type: "image/jpeg",
              name: splitedURI[splitedURI.length - 1],
            },
            data,
          };
    mutation.mutate(updateData);
  };

  const pickImage = async () => {
    let image = await ImagePicker.openPicker({
      mediaType: "photo",
    });

    let croped = await ImagePicker.openCropper({
      mediaType: "photo",
      path: image.path,
      width: 1080,
      height: 1080,
      cropperCancelText: "Cancle",
      cropperChooseText: "Check",
      cropperToolbarTitle: "이미지를 크롭하세요",
      forceJpg: true,
    });

    if (croped) setImageURI(croped.path);
  };

  useEffect(() => {
    setOptions({
      headerRight: () =>
        mutation.isLoading ? (
          <ActivityIndicator />
        ) : (
          <TouchableOpacity onPress={onSubmit}>
            <Text style={{ color: "#2995FA" }}>저장</Text>
          </TouchableOpacity>
        ),
    });

    return () => {
      DeviceEventEmitter.emit("ProfileRefresh");
      DeviceEventEmitter.emit("HomeAllRefetch");
    };
  }, [name, birthday, phoneNumber, organizationName, imageURI, mutation.isLoading]);

  useEffect(() => {
    if (phoneNumber?.length === 10) {
      setPhoneNumber(phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"));
    }
    if (phoneNumber?.length === 12) {
      setPhoneNumber(phoneNumber.replace(/-/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"));
    }
    if (phoneNumber?.length === 13) {
      setPhoneNumber(phoneNumber.replace(/-/g, "").replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3"));
    }
  }, [phoneNumber]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={100} style={{ flex: 1 }}>
        <Container>
          <ImagePickerView>
            <ImagePickerWrap size={imageSize}>
              <ImagePickerButton size={imageSize} onPress={pickImage} activeOpacity={0.8}>
                <CircleIcon size={imageSize} uri={imageURI} />
              </ImagePickerButton>
            </ImagePickerWrap>
            <ProfileText onPress={pickImage}>프로필 사진 설정</ProfileText>
          </ImagePickerView>
          <Form>
            <Title>이름</Title>
            <Input autoCorrect={false} placeholder="홍길동" defaultValue={name} onChangeText={(text: string) => setName(text)} onEndEditing={() => setName((prev) => prev.trim())} />
          </Form>
          <Form>
            <Title>성별</Title>
            <Input autoCorrect={false} placeholder="남자 or 여자" defaultValue={sex} onChangeText={(text: string) => setSex(text === "남자" ? "M" : "F")} editable={false} />
          </Form>
          <Form>
            <Title>생년월일</Title>
            <TextBtn onPress={() => setShowDatePicker((prev) => !prev)} style={{ borderBottomWidth: 1, borderBottomColor: "#cecece" }}>
              <ItemText>{birthday}</ItemText>
            </TextBtn>
            {Platform.OS === "android" ? (
              <Collapsible collapsed={!showDatePicker}>
                <ItemView style={{ width: "100%", alignItems: "center" }}>
                  <DatePicker textColor={"#000000"} date={new Date(birthday)} mode="date" onDateChange={(value) => setBirthday(value.toISOString().split("T")[0])} />
                </ItemView>
              </Collapsible>
            ) : (
              <Collapsible collapsed={!showDatePicker}>
                <ItemView>
                  <RNDateTimePicker textColor={"#000000"} mode="date" value={new Date(birthday)} display="spinner" onChange={(_, value: Date) => setBirthday(value.toISOString().split("T")[0])} />
                </ItemView>
              </Collapsible>
            )}
          </Form>
          <Form>
            <Title>연락처</Title>
            <Input keyboardType="numeric" placeholder="010-xxxx-xxxx" autoCorrect={false} defaultValue={phoneNumber} onChangeText={(phone: string) => setPhoneNumber(phone)} maxLength={13} />
          </Form>
          <Form>
            <Title>교회</Title>
            <Input
              autoCorrect={false}
              placeholder="시광교회"
              defaultValue={organizationName}
              onChangeText={(text: string) => setOrganizationName(text)}
              onEndEditing={() => setOrganizationName((prev) => prev.trim())}
            />
          </Form>
        </Container>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default EditProfile;
