import React, { useLayoutEffect, useState } from "react";
import { ActivityIndicator, useWindowDimensions, Animated, FlatList, DeviceEventEmitter, NativeSyntheticEvent, TextLayoutEventData, TouchableWithoutFeedback, View } from "react-native";
import styled from "styled-components/native";
import { Feather, Entypo, Ionicons } from "@expo/vector-icons";
import { ClubHomeScreenProps, ClubHomeParamList, RefinedSchedule } from "../../Types/Club";
import { Member } from "../../api";
import ScheduleModal from "./ClubScheduleModal";
import CircleIcon from "../../components/CircleIcon";
import CustomText from "../../components/CustomText";
import { useAppDispatch } from "../../redux/store";
import clubSlice from "../../redux/slices/club";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store/reducers";
import { useToast } from "react-native-toast-notifications";
import Collapsible from "react-native-collapsible";

const MEMBER_ICON_KERNING = 20;
const MEMBER_ICON_SIZE = 50;
const SCREEN_PADDING_SIZE = 20;

const Loader = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Break = styled.View<{ sep: number }>`
  width: 100%;
  margin-bottom: ${(props: any) => props.sep}px;
  margin-top: ${(props: any) => props.sep}px;
  border-bottom-width: 1px;
  border-bottom-color: #e3e3e3;
  opacity: 0.5;
`;

const SectionView = styled.View`
  width: 100%;
  justify-content: flex-start;
  align-items: flex-start;
`;

const TitleView = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 10px;
`;

const SectionTitle = styled(CustomText)`
  font-family: "NotoSansKR-Bold";
  font-size: 15px;
  margin-left: 5px;
  line-height: 22px;
`;

const ContentView = styled.View<{ paddingSize?: number }>`
  padding-left: ${(props: any) => (props.paddingSize ? props.paddingSize + 5 : 5)}px;
  padding-right: ${(props: any) => (props.paddingSize ? props.paddingSize + 5 : 5)}px;
  margin-bottom: 15px;
`;

const ContentText = styled(CustomText)`
  font-size: 13px;
  line-height: 18px;
`;

const ContentSubText = styled(CustomText)`
  font-size: 13px;
  line-height: 18px;
  color: #9a9a9a;
`;

const ScheduleSeparator = styled.View`
  width: 25px;
`;

const ScheduleView = styled.TouchableOpacity`
  min-width: 110px;
  box-shadow: 1px 1px 2px gray;
`;

const ScheduleAddView = styled.TouchableOpacity`
  background-color: white;
  min-width: 110px;
  min-height: 150px;
  justify-content: space-evenly;
  align-items: center;
  box-shadow: 1px 1px 2px gray;
  elevation: 5;
  padding: 20px 5px;
`;

const ScheduleDateView = styled.View<{ index: number }>`
  background-color: ${(props: any) => (props.index === 0 ? "#FF551F" : "#EBEBEB")};
  justify-content: center;
  align-items: center;
  padding: 7px 15px;
  elevation: 3;
  min-height: 40px;
`;

const ScheduleDetailView = styled.View`
  background-color: white;
  padding: 5px 7px;
  elevation: 3;
`;

const ScheduleDetailItemView = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 3px 5px;
`;

const ScheduleText = styled(CustomText)<{ index: number }>`
  font-size: 11px;
  line-height: 15px;
  color: ${(props: any) => (props.index === 0 ? "white" : "black")};
`;

const ScheduleSubText = styled(CustomText)`
  font-size: 10px;
  font-weight: 300;
  color: #939393;
  line-height: 13px;
`;

const ScheduleTitle = styled(CustomText)<{ index: number }>`
  font-size: 18px;
  font-family: "NotoSansKR-Bold";
  line-height: 25px;
  color: ${(props: any) => (props.index === 0 ? "white" : "black")};
`;

const MemberView = styled.View`
  margin-bottom: 150px;
`;

const MemberLineView = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  margin-bottom: 25px;
  margin-top: 2px;
`;

const MemberSubTitleView = styled.View`
  margin-left: 5px;
  margin-bottom: 10px;
`;

const MemberSubTitle = styled(CustomText)`
  font-size: 13px;
  color: #bababa;
`;

const MemberTextView = styled.View`
  margin-left: 5px;
  margin-bottom: 20px;
`;

const MemberText = styled(CustomText)`
  font-size: 11px;
  line-height: 17px;
  color: #b0b0b0;
`;

const ClubHome: React.FC<ClubHomeScreenProps & ClubHomeParamList> = ({
  navigation: { navigate },
  route: {
    name: screenName,
    params: { clubData },
  },
  scrollY,
  offsetY,
  scheduleOffsetX,
  headerDiff,
  schedules,
  syncScrollOffset,
  screenScrollRefs,
}) => {
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(-1);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [memberLoading, setMemberLoading] = useState(true);
  const [memberData, setMemberData] = useState<Member[][]>();
  const [managerData, setManagerData] = useState<Member[][]>();
  const [masterData, setMasterData] = useState<Member>();
  const memberCountPerLine = Math.floor((SCREEN_WIDTH - SCREEN_PADDING_SIZE) / (MEMBER_ICON_SIZE + MEMBER_ICON_KERNING));
  const dispatch = useAppDispatch();
  const myRole = useSelector((state: RootState) => state.club.role);
  const toast = useToast();
  const [clubLongDescLines, setClubLongDescLines] = useState<string[]>(typeof clubData?.clubLongDesc === "string" ? clubData?.clubLongDesc?.split("\n") : []);
  const [isCollapsedLongDesc, setIsCollapsedLongDesc] = useState<boolean>(true);
  const collapsed = 8;

  useLayoutEffect(() => {
    getData();
  }, []);

  const getClubMembers = () => {
    const members: Member[] = [];
    const manager: Member[] = [];
    const memberBundle: Member[][] = [];
    const managerBundle: Member[][] = [];

    if (clubData && clubData.members) {
      for (let i = 0; i < clubData?.members?.length; ++i) {
        if (clubData.members && clubData.members[i].role?.toUpperCase() === "MASTER") {
          setMasterData(clubData.members[i]);
        } else if (clubData.members && clubData.members[i].role?.toUpperCase() === "MANAGER") {
          manager.push(clubData.members[i]);
        } else if (clubData.members && clubData.members[i].role?.toUpperCase() === "MEMBER") {
          members.push(clubData.members[i]);
        }
      }
    }

    for (var i = 0; i < members.length; i += memberCountPerLine) {
      memberBundle.push(members.slice(i, i + memberCountPerLine));
    }

    for (var i = 0; i < manager.length; i += memberCountPerLine) {
      managerBundle.push(manager.slice(i, i + memberCountPerLine));
    }
    setMemberData(memberBundle);
    setManagerData(managerBundle);
  };

  const getData = async () => {
    getClubMembers();
    setMemberLoading(false);
  };

  const closeScheduleModal = (refresh: boolean) => {
    setScheduleVisible(false);
    if (refresh) DeviceEventEmitter.emit("SchedulesRefetch");
  };

  const goToScheduleAdd = () => {
    if (myRole && ["MASTER", "MANAGER"].includes(myRole)) {
      return navigate("ClubStack", { screen: "ClubScheduleAdd", clubData });
    } else {
      toast.show(`권한이 없습니다.`, { type: "warning" });
    }
  };

  const clubLongDescTouch = () => {
    setIsCollapsedLongDesc((prev) => !prev);
  };

  const loading = memberLoading;
  return loading ? (
    <Loader>
      <ActivityIndicator />
    </Loader>
  ) : (
    <Animated.ScrollView
      ref={(ref) => {
        screenScrollRefs.current[screenName] = ref;
      }}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      onMomentumScrollEnd={(event) => {
        dispatch(clubSlice.actions.updateClubHomeScrollY({ scrollY: event.nativeEvent.contentOffset.y }));
        syncScrollOffset(screenName);
      }}
      onScrollEndDrag={() => syncScrollOffset(screenName)}
      contentOffset={{ x: 0, y: offsetY ?? 0 }}
      style={{
        flex: 1,
        paddingTop: 15,
        backgroundColor: "white",
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [0, headerDiff],
              outputRange: [-headerDiff, 0],
              extrapolate: "clamp",
            }),
          },
        ],
      }}
      contentContainerStyle={{
        paddingTop: headerDiff,
        minHeight: SCREEN_HEIGHT + headerDiff,
        backgroundColor: "white",
      }}
    >
      <SectionView style={{ paddingHorizontal: SCREEN_PADDING_SIZE }}>
        <TitleView>
          <Entypo name="megaphone" size={16} color="black" />
          <SectionTitle>ABOUT</SectionTitle>
        </TitleView>
        <ContentView>
          {clubLongDescLines.length < collapsed ? (
            <ContentText>{clubData.clubLongDesc}</ContentText>
          ) : (
            <TouchableWithoutFeedback onPress={clubLongDescTouch}>
              <View>
                {isCollapsedLongDesc ? (
                  <ContentText>
                    {`${clubLongDescLines.slice(0, collapsed).join("\n")}...`}
                    <ContentSubText>{` 더보기`}</ContentSubText>
                  </ContentText>
                ) : (
                  <ContentText>{`${clubLongDescLines.slice(0, collapsed).join("\n")}`}</ContentText>
                )}
                <Collapsible collapsed={isCollapsedLongDesc}>
                  <ContentText>{`${clubLongDescLines.slice(collapsed).join("\n")}`}</ContentText>
                </Collapsible>
              </View>
            </TouchableWithoutFeedback>
          )}
        </ContentView>
        <Break sep={15} />
      </SectionView>
      <SectionView>
        <TitleView style={{ paddingHorizontal: SCREEN_PADDING_SIZE }}>
          <Ionicons name="calendar" size={16} color="black" />
          <SectionTitle>SCHEDULE</SectionTitle>
        </TitleView>
        {myRole && myRole !== "PENDING" ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => dispatch(clubSlice.actions.updateClubHomeScheduleScrollX({ scrollX: event.nativeEvent.contentOffset.x }))}
            contentOffset={{ x: scheduleOffsetX ?? 0, y: 0 }}
            contentContainerStyle={{
              paddingVertical: 6,
              paddingHorizontal: SCREEN_PADDING_SIZE,
            }}
            data={schedules}
            keyExtractor={(item: RefinedSchedule, index: number) => String(index)}
            ItemSeparatorComponent={ScheduleSeparator}
            renderItem={({ item, index }: { item: RefinedSchedule; index: number }) =>
              item.isEnd === false ? (
                <ScheduleView
                  onPress={() => {
                    setScheduleVisible(true);
                    setSelectedSchedule(index);
                  }}
                >
                  <ScheduleDateView index={index}>
                    <ScheduleText index={index}>{item.year}</ScheduleText>
                    <ScheduleTitle index={index}>
                      {item.month}/{item.day} {item.dayOfWeek}
                    </ScheduleTitle>
                  </ScheduleDateView>
                  <ScheduleDetailView>
                    <ScheduleDetailItemView>
                      <Feather name="clock" size={10} color="#CCCCCC" style={{ marginRight: 5 }} />
                      <ScheduleText>
                        {`${item.ampm} ${item.hour} 시`} {item.minute !== "0" ? `${item.minute} 분` : ""}
                      </ScheduleText>
                    </ScheduleDetailItemView>
                    <ScheduleDetailItemView>
                      <Feather name="map-pin" size={10} color="#CCCCCC" style={{ marginRight: 5 }} />
                      <ScheduleText>{item.location}</ScheduleText>
                    </ScheduleDetailItemView>
                    <Break sep={2} />

                    <ScheduleDetailItemView>
                      <Ionicons name="people-sharp" size={12} color="#CCCCCC" style={{ marginRight: 7 }} />
                      <ScheduleText>{item.members?.length}명 참석</ScheduleText>
                    </ScheduleDetailItemView>
                    <ScheduleDetailItemView style={{ justifyContent: "center" }}>
                      <ScheduleSubText>더보기</ScheduleSubText>
                    </ScheduleDetailItemView>
                  </ScheduleDetailView>
                </ScheduleView>
              ) : (
                <ScheduleAddView onPress={goToScheduleAdd}>
                  <Feather name="plus" size={28} color="#6E6E6E" />
                  <ScheduleText style={{ textAlign: "center", color: "#6E6E6E" }}>{`새로운 스케줄을\n등록해보세요.`}</ScheduleText>
                </ScheduleAddView>
              )
            }
          />
        ) : (
          // Schedule FlatList의 padding 이슈 때문에 ContentView에 paddingSize Props 추가.
          <ContentView paddingSize={SCREEN_PADDING_SIZE}>
            <ContentText>모임의 멤버만 확인할 수 있습니다.</ContentText>
          </ContentView>
        )}
      </SectionView>
      <SectionView style={{ paddingHorizontal: SCREEN_PADDING_SIZE }}>
        <Break sep={15} />
        <TitleView>
          <Feather name="users" size={16} color="black" />
          <SectionTitle>MEMBER</SectionTitle>
        </TitleView>
        <MemberView>
          <MemberSubTitleView>
            <MemberSubTitle>Leader</MemberSubTitle>
          </MemberSubTitleView>
          {masterData ? (
            <MemberLineView>
              <CircleIcon size={MEMBER_ICON_SIZE} uri={masterData?.thumbnail} name={masterData?.name} badge={"stars"} />
            </MemberLineView>
          ) : (
            <MemberTextView>
              <MemberText>리더가 없습니다.</MemberText>
            </MemberTextView>
          )}

          <MemberSubTitleView>
            <MemberSubTitle>Manager</MemberSubTitle>
          </MemberSubTitleView>
          {managerData?.length !== 0 ? (
            managerData?.map((bundle, index) => (
              <MemberLineView key={index}>
                {bundle.map((item, index) => (
                  <CircleIcon key={index} size={MEMBER_ICON_SIZE} uri={item.thumbnail} name={item.name} kerning={MEMBER_ICON_KERNING} badge={"check-circle"} />
                ))}
              </MemberLineView>
            ))
          ) : (
            <MemberTextView>
              <MemberText>매니저가 없습니다.</MemberText>
            </MemberTextView>
          )}
          <MemberSubTitleView>
            <MemberSubTitle>Member</MemberSubTitle>
          </MemberSubTitleView>
          {memberData?.length !== 0 ? (
            memberData?.map((bundle, index) => (
              <MemberLineView key={index}>
                {bundle.map((item, index) => (
                  <CircleIcon key={index} size={MEMBER_ICON_SIZE} uri={item.thumbnail} name={item.name} kerning={MEMBER_ICON_KERNING} />
                ))}
              </MemberLineView>
            ))
          ) : (
            <MemberTextView>
              <MemberText>멤버들이 클럽을 가입할 수 있게 해보세요.</MemberText>
            </MemberTextView>
          )}
        </MemberView>
      </SectionView>

      <ScheduleModal
        visible={scheduleVisible}
        clubId={clubData.id}
        scheduleData={schedules}
        selectIndex={selectedSchedule}
        closeModal={(refresh: boolean) => {
          closeScheduleModal(refresh);
        }}
      />
    </Animated.ScrollView>
  );
};

export default ClubHome;
