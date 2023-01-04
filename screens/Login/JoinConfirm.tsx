import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { useMutation } from "react-query";
import { UserApi, SignUp } from "../../api";
import styled from "styled-components/native";
import { useToast } from "react-native-toast-notifications";

const Container = styled.View`
  width: 100%;
  height: 95%;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  padding-horizontal: 20px;
`;

const Wrap = styled.View`
  width: 100%;
`;

const AskText = styled.Text`
  color: #000000;
  font-size: 20px;
  font-weight: bold;
  margin-top: 24px;
`;

const SubText = styled.Text`
  color: #a0a0a0;
  font-size: 12px;
  margin-top: 7px;
  margin-bottom: 15px;
`;

const Form = styled.View`
  width: 100%;
  margin-top: 25px;
`;

const TitleBorder = styled.View`
  width: 100%;
  padding-bottom: 5px;
  border-bottom-width: 1px;
  border-bottom-color: #b3b3b3;
`;

const Title = styled.Text`
  color: #000000;
  font-size: 16px;
  font-weight: bold;
`;

const TextWrap = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 6px;
`;

const TextTitle = styled.Text`
  color: #838383;
  font-size: 14px;
`;

const TextInfo = styled.Text`
  color: #295af5;
  font-size: 14px;
`;

const Input = styled.TextInput`
  border-bottom-width: 1px;
  border-bottom-color: #b3b3b3;
  margin-top: 47px;
  font-size: 18px;
`;

const Button = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 48px;
  background-color: ${(props) => (props.disabled ? "#d3d3d3" : "#295AF5")};
`;

const ButtonTitle = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: 700;
`;

const JoinConfirm: React.FC<NativeStackScreenProps<any, "AuthStack">> = ({
  navigation: { navigate },
  route: {
    params: { name, email, password, sex, birth, phone, church },
  },
}) => {
  const toast = useToast();

  const mutation = useMutation(UserApi.registerUserInfo, {
    onSuccess: (res) => {
      if (res.status === 200 && res.resultCode === "OK") {
        console.log(`success`);
        navigate("LoginStack", {
          screen: "JoinStepSuccess",
          email,
          password,
        });
      } else if (res.status === 404) {
        console.log(res);
        toast.show("이미 가입된 사용자입니다.", {
          type: "warning",
        });
        navigate("LoginStack", {
          screen: "JoinStepOne",
        });
      } else {
        console.log(`user register mutation success but please check status code`);
        console.log(res);
        toast.show(`${res.error} (Error Code: ${res.status})`, {
          type: "warning",
        });
      }
    },
    onError: (error) => {
      console.log("--- Error ---");
      console.log(`error: ${error}`);
    },
  });

  const onSubmit = () => {
    const data = {
      name,
      email,
      password,
      sex: sex === "남성" ? "M" : "F",
      birthday: birth,
      phoneNumber: phone,
      organizationName: church,
    };

    const requestData: SignUp = data;

    console.log(requestData);

    mutation.mutate(requestData);
  };

  return (
    <Container>
      <Wrap>
        <AskText>입력 정보가 모두 일치한가요?</AskText>
        <SubText>잘못 입력된 정보는 뒤로가기로 수정할 수 있습니다.</SubText>

        <Form>
          <TitleBorder>
            <Title>로그인 정보</Title>
          </TitleBorder>
          <TextWrap>
            <TextTitle>이름</TextTitle>
            <TextInfo>{name}</TextInfo>
          </TextWrap>
          <TextWrap>
            <TextTitle>이메일</TextTitle>
            <TextInfo>{email}</TextInfo>
          </TextWrap>
        </Form>
        <Form>
          <TitleBorder>
            <Title>기본 정보</Title>
          </TitleBorder>
          <TextWrap>
            <TextTitle>성별</TextTitle>
            <TextInfo>{sex}</TextInfo>
          </TextWrap>
          <TextWrap>
            <TextTitle>생년월일</TextTitle>
            <TextInfo>{birth}</TextInfo>
          </TextWrap>
          <TextWrap>
            <TextTitle>연락처</TextTitle>
            <TextInfo>{phone}</TextInfo>
          </TextWrap>
          <TextWrap>
            <TextTitle>출석교회</TextTitle>
            <TextInfo>{church}</TextInfo>
          </TextWrap>
        </Form>
      </Wrap>
      <Wrap>
        <Button onPress={onSubmit}>
          <ButtonTitle>일치합니다</ButtonTitle>
        </Button>
      </Wrap>
    </Container>
  );
};

export default JoinConfirm;
