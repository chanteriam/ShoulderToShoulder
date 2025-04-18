from rest_framework.serializers import ModelSerializer
from django.contrib.auth.models import User
from .db_models import *

class HobbyTypeSerializer(ModelSerializer):
    class Meta:
        model = HobbyType
        fields = "__all__"

class HobbySerializer(ModelSerializer):
    class Meta:
        model = Hobby
        fields = "__all__"

class GroupSerializer(ModelSerializer):
    class Meta:
        model = Group
        fields = "__all__"
        
class EventSerializer(ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"

class OnbordingSerializer(ModelSerializer):
    class Meta:
        model = Onboarding
        fields = "__all__"

class ScenariosSerializer(ModelSerializer):   
    class Meta:
        model = Scenarios
        fields = "__all__"    
         
class AvailabilitySerializer(ModelSerializer):
    class Meta:
        model = Availability
        fields = "__all__"

class BulkAvailabilitySerializer(ModelSerializer):
    class Meta:
        model = Availability
        fields = "__all__"

    def create(self, validated_data):
        # Custom method to handle list of availability data
        return [Availability.objects.create(**item) for item in validated_data]

    def update(self, instances, validated_data):
        # Handle updates if necessary
        pass

class ChoiceSerializer(ModelSerializer):
    class Meta:
        model = Choice
        fields = "__all__"

class ProfileSerializer(ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            return request.build_absolute_uri(obj.profile_picture.url)
        return None

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class ApplicationTokenSerializer(ModelSerializer):
    class Meta:
        model = ApplicationToken
        fields = "__all__"

class UserEventsSerializer(ModelSerializer):
    class Meta:
        model = UserEvents
        fields = "__all__"

class SuggestionResultsSerializer(ModelSerializer):
    class Meta:
        model = SuggestionResults
        fields = "__all__"

class PanelEventSerializer(ModelSerializer):
    class Meta:
        model = PanelEvent
        fields = "__all__"

class PanelUserPreferencesSerializer(ModelSerializer):
    class Meta:
        model = PanelUserPreferences
        fields = "__all__"

class PanelScenarioSerializer(ModelSerializer):
    class Meta:
        model = PanelScenario
        fields = "__all__"
