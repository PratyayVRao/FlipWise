from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import supabase
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="FlipWise API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
supabase_client = supabase.create_client(supabase_url, supabase_key)

# Models
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    username: Optional[str] = None

class Flashcard(BaseModel):
    id: Optional[str] = None
    front_text: str
    back_text: str

class StudySet(BaseModel):
    title: str
    description: Optional[str] = None
    flashcards: List[Flashcard]

# Auth endpoints
@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    try:
        response = supabase_client.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if hasattr(response, 'error') and response.error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    try:
        # Register user
        response = supabase_client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if hasattr(response, 'error') and response.error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=response.error.message
            )
        
        # Create profile
        user_id = response.user.id
        username = user_data.username or user_data.email.split('@')[0]
        
        profile_response = supabase_client.table('profiles').insert({
            "id": user_id,
            "username": username
        }).execute()
        
        if hasattr(profile_response, 'error') and profile_response.error:
            # Rollback user creation if profile creation fails
            # This is a simplification - in production you'd want more robust error handling
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile"
            )
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.post("/api/auth/logout")
async def logout():
    try:
        response = supabase_client.auth.sign_out()
        return {"success": True}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Profile endpoints
@app.get("/api/profile/{user_id}")
async def get_profile(user_id: str):
    try:
        profile = supabase_client.table('profiles').select('*').eq('id', user_id).single().execute()
        
        if not profile.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return profile.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.put("/api/profile/{user_id}")
async def update_profile(user_id: str, username: str):
    try:
        profile = supabase_client.table('profiles').update({
            "username": username,
            "updated_at": "now()"
        }).eq('id', user_id).execute()
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Study set endpoints
@app.get("/api/study-sets")
async def get_study_sets(user_id: Optional[str] = None):
    try:
        query = supabase_client.table('study_sets')
        
        if user_id:
            query = query.eq('user_id', user_id)
        
        response = query.order('created_at', desc=True).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/study-sets/{set_id}")
async def get_study_set(set_id: str):
    try:
        # Get the study set
        study_set = supabase_client.table('study_sets').select('*').eq('id', set_id).single().execute()
        
        if not study_set.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study set not found"
            )
        
        # Get the flashcards
        flashcards = supabase_client.table('flashcards').select('*').eq('study_set_id', set_id).execute()
        
        # Combine the data
        result = study_set.data
        result['flashcards'] = flashcards.data
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/api/study-sets")
async def create_study_set(study_set: StudySet, user_id: str):
    try:
        # Create the study set
        set_response = supabase_client.table('study_sets').insert({
            "title": study_set.title,
            "description": study_set.description,
            "user_id": user_id
        }).select().single().execute()
        
        if not set_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create study set"
            )
        
        study_set_id = set_response.data['id']
        
        # Create the flashcards
        flashcards_data = [
            {
                "study_set_id": study_set_id,
                "front_text": card.front_text,
                "back_text": card.back_text
            }
            for card in study_set.flashcards
        ]
        
        flashcards_response = supabase_client.table('flashcards').insert(flashcards_data).execute()
        
        return set_response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.put("/api/study-sets/{set_id}")
async def update_study_set(set_id: str, study_set: StudySet, user_id: str):
    try:
        # Verify ownership
        ownership = supabase_client.table('study_sets').select('user_id').eq('id', set_id).single().execute()
        
        if not ownership.data or ownership.data['user_id'] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this study set"
            )
        
        # Update the study set
        set_response = supabase_client.table('study_sets').update({
            "title": study_set.title,
            "description": study_set.description,
            "updated_at": "now()"
        }).eq('id', set_id).execute()
        
        # Handle flashcards
        # First, get existing flashcards
        existing_cards = supabase_client.table('flashcards').select('id').eq('study_set_id', set_id).execute()
        existing_ids = [card['id'] for card in existing_cards.data]
        
        # Identify cards to update, add, or delete
        update_cards = []
        add_cards = []
        keep_ids = []
        
        for card in study_set.flashcards:
            if card.id and card.id in existing_ids:
                # Update existing card
                update_cards.append({
                    "id": card.id,
                    "front_text": card.front_text,
                    "back_text": card.back_text,
                    "updated_at": "now()"
                })
                keep_ids.append(card.id)
            else:
                # Add new card
                add_cards.append({
                    "study_set_id": set_id,
                    "front_text": card.front_text,
                    "back_text": card.back_text
                })
        
        # Delete cards that are no longer in the set
        delete_ids = [id for id in existing_ids if id not in keep_ids]
        if delete_ids:
            supabase_client.table('flashcards').delete().in_('id', delete_ids).execute()
        
        # Update existing cards
        if update_cards:
            for card in update_cards:
                supabase_client.table('flashcards').update(card).eq('id', card['id']).execute()
        
        # Add new cards
        if add_cards:
            supabase_client.table('flashcards').insert(add_cards).execute()
        
        return {"success": True, "id": set_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.delete("/api/study-sets/{set_id}")
async def delete_study_set(set_id: str, user_id: str):
    try:
        # Verify ownership
        ownership = supabase_client.table('study_sets').select('user_id').eq('id', set_id).single().execute()
        
        if not ownership.data or ownership.data['user_id'] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this study set"
            )
        
        # Delete the study set (flashcards will be deleted by cascade)
        supabase_client.table('study_sets').delete().eq('id', set_id).execute()
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Study session endpoints
@app.post("/api/study-sessions")
async def create_study_session(user_id: str, study_set_id: str, mode: str):
    try:
        session = supabase_client.table('study_sessions').insert({
            "user_id": user_id,
            "study_set_id": study_set_id,
            "mode": mode
        }).select().single().execute()
        
        return session.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.put("/api/study-sessions/{session_id}/complete")
async def complete_study_session(session_id: str):
    try:
        supabase_client.table('study_sessions').update({
            "completed_at": "now()"
        }).eq('id', session_id).execute()
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

